import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';

function getApiBaseUrl(): string {
  const base = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:5000/';
  return base.replace(/\/?$/, '');
}

function getAuthToken(): string | null {
  try {
    const fromGlobal = (globalThis as any).authToken;
    if (fromGlobal) return fromGlobal;
    if (typeof window !== 'undefined' && window?.localStorage) {
      return window.localStorage.getItem('authToken');
    }
  } catch {}
  return null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  if (typeof btoa !== 'undefined') return btoa(binary);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : NaN;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : NaN;
    const triple = (a << 16) | ((isNaN(b) ? 0 : b) << 8) | (isNaN(c) ? 0 : c);
    out += chars[(triple >> 18) & 63];
    out += chars[(triple >> 12) & 63];
    out += isNaN(b) ? '=' : chars[(triple >> 6) & 63];
    out += isNaN(c) ? '=' : chars[triple & 63];
  }
  return out;
}

const VOICE_ENABLED_KEY = 'mindmate_voice_enabled';

type VoiceContextValue = {
  isStreaming: boolean;
  voiceEnabled: boolean | null;
  lastTranscript: string | null;
  lastReply: string | null;
  lastError: string | null;
  setVoiceEnabled: (enabled: boolean) => void;
  requestVoice: () => Promise<{ ok: boolean; error?: string }>;
  stopVoice: () => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

function getStorage(): { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> } {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (k) => Promise.resolve(window.localStorage.getItem(k)),
      setItem: (k, v) => { window.localStorage.setItem(k, v); return Promise.resolve(); },
    };
  }
  return {
    getItem: (k) => import('@react-native-async-storage/async-storage').then(({ default: A }) => A.getItem(k)),
    setItem: (k, v) => import('@react-native-async-storage/async-storage').then(({ default: A }) => A.setItem(k, v)),
  };
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const tokenRef = useRef<string | null>(null);
  const webChunksRef = useRef<Blob[]>([]);
  const nativeRecordingRef = useRef<any>(null);

  const processVoiceAudio = useCallback(async (audioBase64: string, mimeType?: string) => {
    const token = tokenRef.current || getAuthToken();
    if (!token) throw new Error('Please log in again.');
    const baseUrl = getApiBaseUrl();
    const resp = await fetch(`${baseUrl}/api/voice/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ audioBase64, mimeType: mimeType || 'application/octet-stream' }),
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(payload?.error || 'Voice processing failed.');
    setLastTranscript(payload.transcript || null);
    setLastReply(payload.reply || null);
    setLastError(null);
  }, []);

  const stopVoice = useCallback(() => {
    const isWeb = Platform.OS === 'web';

    try {
      if (isWeb && recorderRef.current) {
        recorderRef.current.stop();
      }
    } catch {}
    try {
      if (isWeb) streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {}
    try {
      if (!isWeb && nativeRecordingRef.current?.stopAndUnloadAsync) {
        (async () => {
          try {
            const recording = nativeRecordingRef.current;
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            nativeRecordingRef.current = null;
            if (uri) {
              const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
              if (audioBase64) {
                await processVoiceAudio(audioBase64, 'audio/m4a');
              } else {
                setLastError('Recorded audio is empty.');
              }
            }
          } catch (err: any) {
            setLastError(err?.message || 'Could not process voice.');
          }
        })();
      }
    } catch {}

    recorderRef.current = null;
    setIsStreaming(false);
  }, [processVoiceAudio]);

  useEffect(() => {
    const storage = getStorage();
    storage.getItem(VOICE_ENABLED_KEY).then((v) => {
      // null/undefined = first time (never asked) → show modal; 'true'/'false' = user already chose
      setVoiceEnabledState(v === null || v === undefined ? null : v === 'true');
    }).catch(() => setVoiceEnabledState(null));
  }, []);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setVoiceEnabledState(enabled);
    getStorage().setItem(VOICE_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
    if (!enabled) stopVoice();
  }, [stopVoice]);

  const requestVoiceWeb = useCallback(async (_token: string): Promise<{ ok: boolean; error?: string }> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mediaRecorder = new MediaRecorder(stream);
    recorderRef.current = mediaRecorder;
    webChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) webChunksRef.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      (async () => {
        try {
          const chunks = webChunksRef.current;
          webChunksRef.current = [];
          if (chunks.length > 0) {
            const fullBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            const buffer = await fullBlob.arrayBuffer();
            const audioBase64 = arrayBufferToBase64(buffer);
            await processVoiceAudio(audioBase64, fullBlob.type || 'audio/webm');
          } else {
            setLastError('Recorded audio is empty.');
          }
        } catch (err: any) {
          setLastError(err?.message || 'Could not process voice.');
        }
      })();
    };

    mediaRecorder.start();
    setIsStreaming(true);
    return { ok: true };
  }, [processVoiceAudio]);

  const requestVoiceNative = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, error: 'Microphone permission was denied.' };
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    nativeRecordingRef.current = recording;
    await recording.startAsync();
    setIsStreaming(true);
    return { ok: true };
  }, []);

  const requestVoice = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const token = getAuthToken();
    if (!token) return { ok: false, error: 'Please log in again.' };
    tokenRef.current = token;
    setLastError(null);

    try {
      if (Platform.OS === 'web' && typeof navigator?.mediaDevices?.getUserMedia === 'function') {
        return await requestVoiceWeb(token);
      }
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return await requestVoiceNative();
      }
      return { ok: false, error: 'Voice support is not available on this platform.' };
    } catch (err: any) {
      stopVoice();
      const msg =
        err?.message ||
        (err?.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not start voice.');
      return { ok: false, error: msg };
    }
  }, [requestVoiceWeb, requestVoiceNative, stopVoice]);

  const value: VoiceContextValue = {
    isStreaming,
    voiceEnabled,
    lastTranscript,
    lastReply,
    lastError,
    setVoiceEnabled,
    requestVoice,
    stopVoice,
  };
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    return {
      isStreaming: false,
      voiceEnabled: null,
      lastTranscript: null,
      lastReply: null,
      lastError: null,
      setVoiceEnabled: () => {},
      requestVoice: async () => ({ ok: false, error: 'No provider' }),
      stopVoice: () => {},
    };
  }
  return ctx;
}

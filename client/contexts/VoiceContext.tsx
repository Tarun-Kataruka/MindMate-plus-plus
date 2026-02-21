import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const AUDIO_CHUNK_MS = 1000;
const NATIVE_CHUNK_MS = 2000;
const NATIVE_CHUNK_DELAY_MS = 400;

function getWsBaseUrl(): string {
  const base = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:5000/';
  const cleaned = base.replace(/\/?$/, '');
  if (cleaned.startsWith('https://')) return cleaned.replace('https://', 'wss://');
  return cleaned.replace('http://', 'ws://');
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = typeof atob !== 'undefined' ? atob(base64) : base64Decode(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64Decode(s: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  lookup[61] = 64; // '=' padding
  const len = s.length;
  if (len % 4 === 1) return '';
  const out: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const a = lookup[s.charCodeAt(i)], b = lookup[s.charCodeAt(i + 1)];
    const c = lookup[s.charCodeAt(i + 2)], d = lookup[s.charCodeAt(i + 3)];
    out.push((a << 2) | (b >> 4));
    if (c !== 64) out.push(((b & 15) << 4) | (c >> 2));
    if (d !== 64) out.push(((c & 3) << 6) | d);
  }
  return String.fromCharCode(...out);
}

const VOICE_ENABLED_KEY = 'mindmate_voice_enabled';

type VoiceContextValue = {
  isStreaming: boolean;
  voiceEnabled: boolean | null;
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
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const stopRequestedRef = useRef(false);
  const nativeRecordingRef = useRef<any>(null);

  const stopVoice = useCallback(() => {
    stopRequestedRef.current = true;
    try {
      recorderRef.current?.stop();
      recorderRef.current = null;
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {}
    try {
      if (nativeRecordingRef.current?.stopAndUnloadAsync) {
        nativeRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        nativeRecordingRef.current = null;
      }
    } catch {}
    try {
      wsRef.current?.close();
      wsRef.current = null;
    } catch {}
    setIsStreaming(false);
  }, []);

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

  const requestVoiceWeb = useCallback(async (token: string): Promise<{ ok: boolean; error?: string }> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const wsUrl = `${getWsBaseUrl()}/audio?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      ws.onclose = (ev) => {
        if (ev.code !== 1000) reject(new Error(ev.reason || 'Connection closed'));
      };
    });

    const mediaRecorder = new MediaRecorder(stream);
    recorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(event.data);
      }
    };

    mediaRecorder.start(AUDIO_CHUNK_MS);
    setIsStreaming(true);
    return { ok: true };
  }, []);

  const requestVoiceNative = useCallback(async (token: string): Promise<{ ok: boolean; error?: string }> => {
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

    const wsUrl = `${getWsBaseUrl()}/audio?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      ws.onclose = (ev) => {
        if (ev.code !== 1000) reject(new Error(ev.reason || 'Connection closed'));
      };
    });

    stopRequestedRef.current = false;
    setIsStreaming(true);

    const runChunkLoop = async () => {
      try {
        while (!stopRequestedRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          nativeRecordingRef.current = recording;
          await recording.startAsync();

          await new Promise<void>((resolve) => {
            const start = Date.now();
            const id = setInterval(() => {
              if (stopRequestedRef.current || Date.now() - start >= NATIVE_CHUNK_MS) {
                clearInterval(id);
                resolve();
              }
            }, 100);
          });

          try {
            await recording.stopAndUnloadAsync();
            nativeRecordingRef.current = null;
            const uri = recording.getURI();
            if (uri && wsRef.current?.readyState === WebSocket.OPEN) {
              const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
              });
              if (base64 && base64.length > 0) {
                const buffer = base64ToArrayBuffer(base64);
                wsRef.current.send(buffer);
              }
            }
          } catch (e) {
            // ignore chunk errors, continue loop
          }

          await new Promise((r) => setTimeout(r, NATIVE_CHUNK_DELAY_MS));
        }
      } catch (_) {
        // loop ended
      } finally {
        try {
          wsRef.current?.close();
          wsRef.current = null;
        } catch {}
        setIsStreaming(false);
      }
    };

    runChunkLoop();
    return { ok: true };
  }, []);

  const requestVoice = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const token = getAuthToken();
    if (!token) return { ok: false, error: 'Please log in again.' };

    try {
      if (Platform.OS === 'web' && typeof navigator?.mediaDevices?.getUserMedia === 'function') {
        return await requestVoiceWeb(token);
      }
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return await requestVoiceNative(token);
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

  const value: VoiceContextValue = { isStreaming, voiceEnabled, setVoiceEnabled, requestVoice, stopVoice };
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    return {
      isStreaming: false,
      voiceEnabled: null,
      setVoiceEnabled: () => {},
      requestVoice: async () => ({ ok: false, error: 'No provider' }),
      stopVoice: () => {},
    };
  }
  return ctx;
}

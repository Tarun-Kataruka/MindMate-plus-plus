import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type AudioTrack = {
  id: string;
  title: string;
  artist?: string;
  duration?: string;
  source: number | { uri: string };
};

type PlayerState = {
  queue: AudioTrack[];
  currentIndex: number;
  isPlaying: boolean;
};

type AudioPlayerContextValue = {
  state: PlayerState;
  current: AudioTrack | null;
  loadQueue: (tracks: AudioTrack[], startIndex?: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  clear: () => Promise<void>;
  favorites: Record<string, AudioTrack>;
  toggleFavorite: (track: AudioTrack) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

async function configureAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playThroughEarpieceAndroid: false,
  });
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<AudioTrack[]>([]);
  const [state, setState] = useState<PlayerState>({ queue: [], currentIndex: -1, isPlaying: false });
  const [favorites, setFavorites] = useState<Record<string, AudioTrack>>({});

  useEffect(() => {
    configureAudio();
    try {
      const raw = (typeof window !== 'undefined') ? window.localStorage.getItem('favorites') : null;
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const persistFavorites = useCallback((map: Record<string, AudioTrack>) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('favorites', JSON.stringify(map));
    } catch {}
  }, []);

  const current = useMemo(() => {
    if (state.currentIndex < 0 || state.currentIndex >= queueRef.current.length) return null;
    return queueRef.current[state.currentIndex] ?? null;
  }, [state.currentIndex]);

  // loadAndPlayIndex only uses refs and its own parameters, so the dependency array can be empty.
  // This resolves the "Cannot access 'next' before initialization" error.
  const loadAndPlayIndex = useCallback(async (index: number, autoPlay: boolean) => {
    if (index < 0 || index >= queueRef.current.length) return;
    const track = queueRef.current[index];
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(track.source as any, { shouldPlay: autoPlay });
      soundRef.current = sound;
      setState(s => ({ ...s, currentIndex: index, isPlaying: autoPlay, queue: queueRef.current }));
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            // Recursively call loadAndPlayIndex for the next track
            void loadAndPlayIndex(index + 1, true); 
          } else {
            setState(prev => ({ ...prev, isPlaying: !!status.isPlaying }));
          }
        }
      });
    } catch (e) {
      // noop
    }
  }, []); // <--- FIX APPLIED HERE: Changed from [next] to []

  const loadQueue = useCallback(async (tracks: AudioTrack[], startIndex: number = 0) => {
    queueRef.current = tracks;
    setState({ queue: tracks, currentIndex: -1, isPlaying: false });
    await loadAndPlayIndex(startIndex, true);
  }, [loadAndPlayIndex]);

  const play = useCallback(async () => {
    if (!soundRef.current) {
      if (state.currentIndex >= 0) {
        await loadAndPlayIndex(state.currentIndex, true);
      }
      return;
    }
    await soundRef.current.playAsync();
    setState(s => ({ ...s, isPlaying: true }));
  }, [loadAndPlayIndex, state.currentIndex]);

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync();
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const toggle = useCallback(async () => {
    if (state.isPlaying) return pause();
    return play();
  }, [pause, play, state.isPlaying]);

  const next = useCallback(async () => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < queueRef.current.length) {
      await loadAndPlayIndex(nextIndex, true);
    }
  }, [loadAndPlayIndex, state.currentIndex]);

  const prev = useCallback(async () => {
    const prevIndex = state.currentIndex - 1;
    if (prevIndex >= 0) {
      await loadAndPlayIndex(prevIndex, true);
    }
  }, [loadAndPlayIndex, state.currentIndex]);

  const clear = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    queueRef.current = [];
    setState({ queue: [], currentIndex: -1, isPlaying: false });
  }, []);

  const toggleFavorite = useCallback((track: AudioTrack) => {
    setFavorites(prev => {
      const next = { ...prev };
      if (next[track.id]) {
        delete next[track.id];
      } else {
        next[track.id] = track;
      }
      persistFavorites(next);
      return next;
    });
  }, [persistFavorites]);

  const value = useMemo<AudioPlayerContextValue>(() => ({ state, current, loadQueue, play, pause, toggle, next, prev, clear, favorites, toggleFavorite }), [state, current, loadQueue, play, pause, toggle, next, prev, clear, favorites, toggleFavorite]);

  return (
    <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}

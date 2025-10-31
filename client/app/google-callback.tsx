import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function GoogleCallback() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const [status, setStatus] = useState('Connecting Google…');

  useEffect(() => {
    const exchange = async () => {
      const { code, error } = params as any;
      if (error) {
        setStatus('Google sign-in cancelled');
        setTimeout(() => router.replace('/(tabs)/planner/plan'), 1200);
        return;
      }
      if (!code) {
        setStatus('Missing authorization code');
        setTimeout(() => router.replace('/(tabs)/planner/plan'), 1200);
        return;
      }
      try {
        const token = (globalThis as any).authToken as string | undefined;
        const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/?$/, '/');
        const res = await fetch(`${baseUrl}api/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({} as any));
          throw new Error(msg?.message || `HTTP ${res.status}`);
        }
        setStatus('Google connected');
      } catch (e: any) {
        setStatus(`Failed to connect: ${e?.message || 'unknown error'}`);
      } finally {
        setTimeout(() => router.replace('/(tabs)/planner/plan'), 1000);
      }
    };
    exchange();
  }, [params]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12 }}>{status}</Text>
    </View>
  );
}



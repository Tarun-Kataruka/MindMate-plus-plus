import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function GoogleCallback() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const [status, setStatus] = useState('Connecting Google…');
  const hasExchanged = useRef(false);

  useEffect(() => {
    const exchange = async () => {
      // Prevent multiple exchanges of the same code
      if (hasExchanged.current) {
        console.log('Exchange already in progress or completed');
        return;
      }
      hasExchanged.current = true;
      const { code, error } = params as any;
      if (error) {
        console.error('Google OAuth error from redirect:', error);
        setStatus('Google sign-in cancelled');
        setTimeout(() => router.replace('/(tabs)/planner/plan'), 1200);
        return;
      }
      if (!code) {
        console.error('No authorization code received');
        setStatus('Missing authorization code');
        setTimeout(() => router.replace('/(tabs)/planner/plan'), 1200);
        return;
      }
      try {
        const token = (globalThis as any).authToken as string | undefined;
        if (!token) {
          console.error('No auth token found in globalThis');
          setStatus('Not authenticated');
          setTimeout(() => router.replace('/(tabs)/planner/plan'), 1200);
          return;
        }
        const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/?$/, '/');
        console.log('Exchanging code for token, URL:', `${baseUrl}api/google/exchange`);
        const res = await fetch(`${baseUrl}api/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({} as any));
          console.error('Token exchange failed:', {
            status: res.status,
            statusText: res.statusText,
            message: msg?.message,
            error: msg?.error
          });
          throw new Error(msg?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('Token exchange successful:', data);
        setStatus('Google connected');
      } catch (e: any) {
        console.error('Error during token exchange:', e);
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



import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  let token: string | null = null;
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      token = window.localStorage.getItem('authToken');
    }
    // fallback to in-memory token if present
    if (!token && typeof globalThis !== 'undefined') {
      // @ts-ignore
      token = (globalThis as any).authToken ?? null;
    }
  } catch {
    // ignore
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}

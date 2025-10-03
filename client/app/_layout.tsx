import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [bootstrapped, setBootstrapped] = React.useState(false);
  React.useEffect(() => {
    const loadToken = async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          stored = window.localStorage.getItem('authToken');
        } else {
          // simple fallback; for production prefer expo-secure-store
          stored = null;
        }
        if (stored) {
          // @ts-ignore
          (globalThis as any).authToken = stored;
        }
      } catch {
        // ignore
      }
      setBootstrapped(true);
    };
    loadToken();
  }, []);

  if (!bootstrapped) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

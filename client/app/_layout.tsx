import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AudioPlayerProvider } from "@/components/AudioPlayerProvider";
import DraggableMiniPlayer from "@/components/DraggableMiniPlayer";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [bootstrapped, setBootstrapped] = React.useState(false);
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);
  React.useEffect(() => {
    const loadToken = async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === "web" && typeof window !== "undefined") {
          stored = window.localStorage.getItem("authToken");
        } else {
          // simple fallback; for production prefer expo-secure-store
          stored = null;
        }
        if (stored) {
          // @ts-ignore
          (globalThis as any).authToken = stored;
          // Verify token with backend; if invalid, clear and show auth screens
          try {
            const API_BASE = (
              (process.env.EXPO_PUBLIC_API_URL as string) || ""
            ).replace(/\/?$/, "/");
            const res = await fetch(`${API_BASE}api/auth/me`, {
              headers: { Authorization: `Bearer ${stored}` },
            });
            if (res.ok) {
              setIsAuthed(true);
            } else {
              if (Platform.OS === "web" && typeof window !== "undefined") {
                window.localStorage.removeItem("authToken");
              }
              // @ts-ignore
              (globalThis as any).authToken = undefined;
              setIsAuthed(false);
            }
          } catch {
            setIsAuthed(false);
          }
        } else {
          setIsAuthed(false);
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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AudioPlayerProvider>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                statusBarTranslucent: true,
                statusBarStyle: colorScheme === "dark" ? "light" : "dark",
              }}
            >
              {isAuthed ? (
                <Stack.Screen name="(tabs)" />
              ) : (
                <Stack.Screen name="(auth)" />
              )}
            </Stack>
            <DraggableMiniPlayer />
          </View>
        </AudioPlayerProvider>
      </GestureHandlerRootView>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        translucent
        backgroundColor="transparent"
      />
    </ThemeProvider>
  );
}

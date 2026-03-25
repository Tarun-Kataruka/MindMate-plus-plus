import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import QuoteOfTheDay from "../../components/QuoteOfTheDay";
import { router } from "expo-router";
import TracksSection from "../../components/TracksSection";
import BrainBreak from "../../components/BrainBreak";
import EmotionTrends from "../../components/EmotionTrends";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_AVATAR =
  "https://img.icons8.com/ios-filled/100/000000/user-male-circle.png";
const BOT_GIF = require("../../assets/tink.gif");

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingIcon(): keyof typeof Ionicons.glyphMap {
  const h = new Date().getHours();
  if (h < 6 || h >= 20) return "moon-outline";
  if (h < 12) return "sunny-outline";
  if (h < 17) return "partly-sunny-outline";
  return "cloudy-night-outline";
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);
  const API_BASE = (
    ((process.env.EXPO_PUBLIC_API_URL as string) || "").replace(/\/?$/, "/")
  );

  const fetchMe = useCallback(async () => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      if (!token) return;
      const res = await fetch(`${API_BASE}api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.user) {
        if (data.user.name) {
          setFirstName(String(data.user.name).split(" ")[0]);
        }
        if (data.user.avatarUrl) setAvatarUrl(String(data.user.avatarUrl));
      }
    } catch {}
  }, [API_BASE]);

  useFocusEffect(
    useCallback(() => {
      fetchMe();
    }, [fetchMe])
  );

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={["#6BCB77", "#4AAE63"]}
        style={styles.headerBg}
      >
        <View style={styles.headerTop}>
          <View style={styles.greetingRow}>
            <Ionicons
              name={getGreetingIcon()}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.greetingSmall}>{getGreeting()}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/profile")}
            activeOpacity={0.8}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{firstName || t("home.friend")}</Text>
        <Text style={styles.headerSubtext}>How are you feeling today?</Text>
      </LinearGradient>

      {/* ===== CHATBOT CARD ===== */}
      <View style={styles.botCard}>
        <LinearGradient
          colors={["#e8f5e9", "#fff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.botGradient}
        >
          <Image source={BOT_GIF} style={styles.botImage} />
          <View style={styles.botTextBlock}>
            <Text style={styles.botLabel}>{t("home.imMate")}</Text>
            <Text style={styles.botSub}>Your mental wellness companion</Text>
            <TouchableOpacity
              style={styles.talkBtn}
              onPress={() => router.push("/(tabs)/chat")}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color="#fff" />
              <Text style={styles.talkBtnText}>{t("home.letsTalk")}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* ===== BRAIN BREAK GAMES ===== */}
      <BrainBreak />

      {/* ===== QUOTE OF THE DAY ===== */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={16} color="#F9A825" />
          <Text style={styles.sectionTitle}>{t("home.quoteOfTheDay")}</Text>
        </View>
        <QuoteOfTheDay apiBaseUrl={process.env.EXPO_PUBLIC_API_URL} />
      </View>

      {/* ===== TRACKS ===== */}
      <EmotionTrends />
      <TracksSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },
  contentContainer: {
    paddingBottom: 90,
  },

  /* Header */
  headerBg: {
    width: "100%",
    paddingTop: 48,
    paddingBottom: 26,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greetingSmall: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "#f5f5f5",
  },
  name: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 2,
  },
  headerSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  /* Bot card */
  botCard: {
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#388e3c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  botGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  botImage: {
    width: 62,
    height: 62,
    marginRight: 12,
  },
  botTextBlock: {
    flex: 1,
  },
  botLabel: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "800",
  },
  botSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 1,
    marginBottom: 8,
  },
  talkBtn: {
    backgroundColor: "#388e3c",
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  talkBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Section shared */
  sectionBlock: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

});

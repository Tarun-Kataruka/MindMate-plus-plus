import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/theme";
import JournalTab from "../../../components/journal/JournalTab";
import BlogTab from "../../../components/journal/BlogTab";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type TabKey = "BLOGS" | "JOURNALS";

export default function JournalsMainScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("JOURNALS");
  const [journals, setJournals] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(() => ["BLOGS", "JOURNALS"] as TabKey[], []);

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const token = (globalThis as any).authToken as string | undefined;
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (activeTab === "JOURNALS") {
          const res = await fetch(`${baseUrl}/api/journals`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const data = await res.json();
          setJournals(Array.isArray(data) ? data : []);
        } else {
          const res = await fetch(`${baseUrl}/api/blogs`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          setBlogs(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        setError(t("journal.failedToLoad"));
        console.error("Failed to fetch tabs data:", e?.message || e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, baseUrl, token]);

  const handleJournalCreated = (created: any) =>
    setJournals((prev) => [created, ...prev]);
  const handleJournalDeleted = (id: string) =>
    setJournals((prev) => prev.filter((j) => (j._id || j.id) !== id));
  const handleBlogCreated = (created: any) =>
    setBlogs((prev) => [created, ...prev]);
  const handleBlogLiked = (updated: any) =>
    setBlogs((prev) =>
      prev.map((b) =>
        (b._id || b.id) === (updated._id || updated.id) ? updated : b
      )
    );

  const tabIcons: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    BLOGS: "newspaper-outline",
    JOURNALS: "book-outline",
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#6BCB77", "#4AAE63"]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>
          {activeTab === "JOURNALS" ? "My Journal" : "Community Blogs"}
        </Text>
        <Text style={styles.headerSub}>
          {activeTab === "JOURNALS"
            ? "Express your thoughts freely"
            : "Read & share wellness stories"}
        </Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tabIcons[tab]}
                  size={16}
                  color={isActive ? "#388e3c" : "rgba(255,255,255,0.85)"}
                />
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {tab === "JOURNALS" ? t("journal.journals") : t("journal.blogs")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#77C272" size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#e53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeTab === "JOURNALS" ? (
        <JournalTab
          data={journals}
          onPressItem={(id) => console.log("View Journal:", id)}
          onCreated={handleJournalCreated}
          onDeleted={handleJournalDeleted}
        />
      ) : (
        <BlogTab
          data={blogs}
          onCreated={handleBlogCreated}
          onLiked={handleBlogLiked}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#388e3c",
    fontWeight: "700",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 20,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 15,
    textAlign: "center",
  },
});

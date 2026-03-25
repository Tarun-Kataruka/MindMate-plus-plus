import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type QuoteData = {
  content: string;
  author: string;
};

type QuoteOfTheDayProps = {
  apiBaseUrl?: string;
};

export default function QuoteOfTheDay({ apiBaseUrl }: QuoteOfTheDayProps) {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        const storageKey = `quote:${todayKey}`;
        let cached: string | null = null;
        try {
          if (typeof window !== "undefined" && window?.localStorage) {
            cached = window.localStorage.getItem(storageKey);
          }
        } catch {}

        if (cached) {
          try {
            const parsed = JSON.parse(cached) as QuoteData;
            if (parsed?.content) {
              setQuoteData({
                content: parsed.content,
                author: parsed.author || "Unknown",
              });
              setLoading(false);
              return;
            }
          } catch {}
        }

        const baseUrl =
          apiBaseUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";
        const normalizedBase = baseUrl.endsWith("/")
          ? baseUrl
          : `${baseUrl}/`;
        const res = await fetch(`${normalizedBase}api/quotes`);
        const data = await res.json();
        if (data?.content) {
          const normalized: QuoteData = {
            content: data.content,
            author: data.author || "Unknown",
          };
          setQuoteData(normalized);
          try {
            if (typeof window !== "undefined" && window?.localStorage) {
              window.localStorage.setItem(
                storageKey,
                JSON.stringify(normalized)
              );
            }
          } catch {}
        }
      } catch (e) {
        console.error("Failed to fetch quote:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [apiBaseUrl]);

  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color="#F9A825"
        style={{ marginTop: 16 }}
      />
    );
  }

  if (!quoteData) return null;

  return (
    <View style={styles.card}>
      <Ionicons
        name="chatbubble-ellipses"
        size={28}
        color="rgba(249,168,37,0.2)"
        style={styles.bgIcon}
      />
      <Text style={styles.quoteText}>{`"${quoteData.content}"`}</Text>
      <View style={styles.authorRow}>
        <View style={styles.dash} />
        <Text style={styles.authorText}>{quoteData.author}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF9C4",
    borderRadius: 16,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#F9A825",
  },
  bgIcon: {
    position: "absolute",
    top: 10,
    right: 12,
  },
  quoteText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    fontStyle: "italic",
    paddingRight: 28,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  dash: {
    width: 20,
    height: 2,
    backgroundColor: "#F9A825",
    borderRadius: 1,
  },
  authorText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
});

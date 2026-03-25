import React from "react";
import { View, Text } from "react-native";

/**
 * Native fallback.
 * Recharts runs only on web, so native builds show a lightweight placeholder.
 */
export default function EmotionTrends() {
  return (
    <View
      style={{
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      }}
    >
      <Text style={{ color: "#111827", fontSize: 16, fontWeight: "700" }}>
        Emotion Trends
      </Text>
      <Text style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
        Chart is available on web.
      </Text>
    </View>
  );
}


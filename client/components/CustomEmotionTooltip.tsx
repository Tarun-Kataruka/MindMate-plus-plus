import React from "react";
import { View, Text, StyleSheet } from "react-native";

const EMOJI_BY_KEY: Record<string, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
};

const ORDER = ["happy", "neutral", "sad"];

export default function CustomEmotionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string; value?: number }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort((a, b) => {
    const aKey = String(a.dataKey ?? "");
    const bKey = String(b.dataKey ?? "");
    return ORDER.indexOf(aKey) - ORDER.indexOf(bKey);
  });

  return (
    <View style={styles.tooltip}>
      <Text style={styles.title}>{label}</Text>
      {sorted.map((p) => {
        const key = String(p.dataKey ?? "");
        const value =
          typeof p.value === "number" ? p.value : p.value ? Number(p.value) : 0;
        const emoji = EMOJI_BY_KEY[key] ?? "•";
        return (
          <Text key={key} style={styles.row}>
            {emoji} {key}: {value}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(148,163,184,0.35)",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  row: {
    color: "#374151",
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 2,
  },
});


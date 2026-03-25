import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import CustomEmotionTooltip from "./CustomEmotionTooltip";

const data = [
  { date: "Mar 20", happy: 5, neutral: 2, sad: 3 },
  { date: "Mar 21", happy: 6, neutral: 1, sad: 4 },
  { date: "Mar 22", happy: 4, neutral: 3, sad: 5 },
  { date: "Mar 23", happy: 7, neutral: 2, sad: 2 },
  { date: "Mar 24", happy: 3, neutral: 4, sad: 6 },
  { date: "Mar 25", happy: 6, neutral: 2, sad: 3 },
];

function renderEmojiDot(emoji: string) {
  // Recharts calls this with dot props (SVG coordinates).
  return function EmojiDot(props: any) {
    const { cx, cy } = props ?? {};
    if (cx === undefined || cy === undefined) return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 14, userSelect: "none" }}
      >
        {emoji}
      </text>
    );
  };
}

export default function EmotionTrends() {
  const chartData = useMemo(() => data, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Emotion Trends</Text>
      </View>

      <View style={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              cursor={false}
              content={(props: any) => <CustomEmotionTooltip {...props} />}
            />
            <Line
              type="monotone"
              dataKey="happy"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={renderEmojiDot("😊")}
              activeDot={renderEmojiDot("😊")}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="neutral"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={renderEmojiDot("😐")}
              activeDot={renderEmojiDot("😐")}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sad"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={renderEmojiDot("😢")}
              activeDot={renderEmojiDot("😢")}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16, // "rounded-2xl"
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: "hidden",
  },
  header: {
    marginBottom: 10,
  },
  title: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  chartWrap: {
    height: 240,
    width: "100%",
  },
});


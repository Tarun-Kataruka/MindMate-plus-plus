import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MemoryGame from "./games/MemoryGame";
import TicTacToe from "./games/TicTacToe";
import WordScramble from "./games/WordScramble";
import SnakeGame from "./games/SnakeGame";

type GameKey = "memory" | "tictactoe" | "word" | "snake" | null;

const GAMES: {
  key: GameKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  { key: "memory", label: "Memory", icon: "grid-outline", color: "#7b1fa2", bg: "#f3e5f5" },
  { key: "snake", label: "Snake", icon: "fitness-outline", color: "#2e7d32", bg: "#e8f5e9" },
  { key: "tictactoe", label: "Tic Tac Toe", icon: "close-circle-outline", color: "#1976d2", bg: "#e3f2fd" },
  { key: "word", label: "Word Scramble", icon: "text-outline", color: "#ef6c00", bg: "#fff3e0" },
];

function GameComponent({ game }: { game: GameKey }) {
  switch (game) {
    case "memory": return <MemoryGame />;
    case "tictactoe": return <TicTacToe />;
    case "word": return <WordScramble />;
    case "snake": return <SnakeGame />;
    default: return null;
  }
}

export default function BrainBreak() {
  const [active, setActive] = useState<GameKey>(null);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Ionicons name="game-controller" size={18} color="#7b1fa2" />
        <Text style={s.headerText}>Brain Break</Text>
      </View>

      {/* Game selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.selectorScroll}
      >
        {GAMES.map((g) => {
          const isActive = active === g.key;
          return (
            <TouchableOpacity
              key={g.key}
              style={[s.gameChip, isActive && { backgroundColor: g.color }]}
              onPress={() => setActive(isActive ? null : g.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.chipIcon,
                  { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : g.bg },
                ]}
              >
                <Ionicons
                  name={g.icon}
                  size={18}
                  color={isActive ? "#fff" : g.color}
                />
              </View>
              <Text
                style={[s.chipLabel, isActive && { color: "#fff" }]}
                numberOfLines={1}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active game */}
      {active && (
        <View style={s.gameArea}>
          <View style={s.gameHeader}>
            <Text style={s.gameTitle}>
              {GAMES.find((g) => g.key === active)?.label}
            </Text>
            <TouchableOpacity onPress={() => setActive(null)}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>
          <GameComponent game={active} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  selectorScroll: {
    gap: 10,
    paddingRight: 8,
  },
  gameChip: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    width: 90,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  gameArea: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
});

import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const POOL = ["🧘","🌿","🌸","🦋","🌈","🎵","💜","🌻","🕊️","🍃","✨","🌙","🐢","🎨","☀️","💧"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBoard() {
  const picked = shuffle(POOL).slice(0, 6);
  return shuffle([...picked, ...picked]);
}

export default function MemoryGame() {
  const [board, setBoard] = useState(makeBoard);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);

  const reset = useCallback(() => {
    setBoard(makeBoard());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
  }, []);

  const flip = useCallback((i: number) => {
    if (flipped.length === 2 || flipped.includes(i) || matched.has(i)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      if (board[next[0]] === board[next[1]]) {
        setMatched((p) => { const s = new Set(p); s.add(next[0]); s.add(next[1]); return s; });
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 600);
      }
    }
  }, [flipped, matched, board]);

  const won = matched.size === board.length;

  return (
    <View>
      <View style={s.info}>
        <Text style={s.infoText}>Moves: {moves}</Text>
        <Text style={s.infoText}>Pairs: {matched.size / 2}/6</Text>
        <TouchableOpacity onPress={reset}><Ionicons name="refresh" size={20} color="#7b1fa2" /></TouchableOpacity>
      </View>
      {won ? (
        <View style={s.won}>
          <Text style={s.wonEmoji}>🎉</Text>
          <Text style={s.wonText}>Done in {moves} moves!</Text>
          <TouchableOpacity style={s.againBtn} onPress={reset}><Text style={s.againText}>Play Again</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={s.grid}>
          {board.map((e, i) => {
            const show = flipped.includes(i) || matched.has(i);
            return (
              <TouchableOpacity key={i} style={[s.card, show && s.cardFlip, matched.has(i) && s.cardMatch]} onPress={() => flip(i)} activeOpacity={0.7} disabled={matched.has(i)}>
                <Text style={s.cardText}>{show ? e : "?"}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  info: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  infoText: { fontSize: 13, color: "#666", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7 },
  card: { width: "28%", aspectRatio: 1, backgroundColor: "#f3e5f5", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#e1bee7" },
  cardFlip: { backgroundColor: "#ede7f6", borderColor: "#9c27b0" },
  cardMatch: { backgroundColor: "#e8f5e9", borderColor: "#66bb6a" },
  cardText: { fontSize: 24 },
  won: { alignItems: "center", paddingVertical: 14 },
  wonEmoji: { fontSize: 36 },
  wonText: { fontSize: 15, fontWeight: "700", color: "#388e3c", marginTop: 6 },
  againBtn: { backgroundColor: "#7b1fa2", paddingHorizontal: 22, paddingVertical: 9, borderRadius: 10, marginTop: 10 },
  againText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

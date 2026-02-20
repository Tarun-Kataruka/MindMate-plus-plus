import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Cell = "X" | "O" | null;
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWin(b: Cell[]): Cell {
  for (const [a, c, d] of WINS) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return null;
}

function botMove(b: Cell[]): number {
  // Try to win
  for (let i = 0; i < 9; i++) { if (!b[i]) { const t = [...b]; t[i] = "O"; if (checkWin(t) === "O") return i; } }
  // Try to block
  for (let i = 0; i < 9; i++) { if (!b[i]) { const t = [...b]; t[i] = "X"; if (checkWin(t) === "X") return i; } }
  // Center
  if (!b[4]) return 4;
  // Random corner
  const corners = [0, 2, 6, 8].filter((i) => !b[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Any
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<string>("");
  const [score, setScore] = useState({ you: 0, bot: 0 });

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setResult("");
  }, []);

  const play = useCallback((i: number) => {
    if (board[i] || gameOver) return;
    const next = [...board];
    next[i] = "X";

    const w1 = checkWin(next);
    if (w1) { setBoard(next); setGameOver(true); setResult("You win!"); setScore((p) => ({ ...p, you: p.you + 1 })); return; }
    if (next.every(Boolean)) { setBoard(next); setGameOver(true); setResult("Draw!"); return; }

    const bi = botMove(next);
    next[bi] = "O";
    setBoard(next);

    const w2 = checkWin(next);
    if (w2) { setGameOver(true); setResult("Bot wins!"); setScore((p) => ({ ...p, bot: p.bot + 1 })); return; }
    if (next.every(Boolean)) { setGameOver(true); setResult("Draw!"); }
  }, [board, gameOver]);

  return (
    <View>
      <View style={s.info}>
        <Text style={s.infoText}>You: {score.you}</Text>
        <Text style={s.infoText}>Bot: {score.bot}</Text>
        <TouchableOpacity onPress={reset}><Ionicons name="refresh" size={20} color="#1976d2" /></TouchableOpacity>
      </View>
      <View style={s.grid}>
        {board.map((cell, i) => (
          <TouchableOpacity key={i} style={s.cell} onPress={() => play(i)} activeOpacity={0.7}>
            <Text style={[s.cellText, cell === "X" ? s.x : s.o]}>{cell || ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {gameOver && (
        <View style={s.resultRow}>
          <Text style={s.resultText}>{result}</Text>
          <TouchableOpacity style={s.againBtn} onPress={reset}><Text style={s.againText}>Again</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  info: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  infoText: { fontSize: 13, color: "#666", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, alignSelf: "center", width: 252 },
  cell: { width: 80, height: 80, backgroundColor: "#e3f2fd", borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#bbdefb" },
  cellText: { fontSize: 32, fontWeight: "800" },
  x: { color: "#1976d2" },
  o: { color: "#e53935" },
  resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 12 },
  resultText: { fontSize: 16, fontWeight: "700", color: "#333" },
  againBtn: { backgroundColor: "#1976d2", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  againText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

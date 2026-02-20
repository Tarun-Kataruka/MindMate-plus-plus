import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GRID = 10;
const SPEED = 180;
type Pos = { r: number; c: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

function randomFood(snake: Pos[]): Pos {
  let p: Pos;
  do { p = { r: Math.floor(Math.random() * GRID), c: Math.floor(Math.random() * GRID) }; }
  while (snake.some((s) => s.r === p.r && s.c === p.c));
  return p;
}

export default function SnakeGame() {
  const initSnake: Pos[] = [{ r: 5, c: 5 }, { r: 5, c: 4 }, { r: 5, c: 3 }];
  const [snake, setSnake] = useState<Pos[]>(initSnake);
  const [food, setFood] = useState<Pos>(() => randomFood(initSnake));
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const dirRef = useRef<Dir>("RIGHT");

  const changeDir = useCallback((d: Dir) => {
    const opp: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (d !== opp[dirRef.current]) { dirRef.current = d; setDir(d); }
  }, []);

  const reset = useCallback(() => {
    const s = [{ r: 5, c: 5 }, { r: 5, c: 4 }, { r: 5, c: 3 }];
    setSnake(s);
    setFood(randomFood(s));
    dirRef.current = "RIGHT";
    setDir("RIGHT");
    setDead(false);
    setScore(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running || dead) return;
    const id = setInterval(() => {
      setSnake((prev) => {
        const d = dirRef.current;
        const head = prev[0];
        const next: Pos = {
          r: head.r + (d === "DOWN" ? 1 : d === "UP" ? -1 : 0),
          c: head.c + (d === "RIGHT" ? 1 : d === "LEFT" ? -1 : 0),
        };
        if (next.r < 0 || next.r >= GRID || next.c < 0 || next.c >= GRID || prev.some((s) => s.r === next.r && s.c === next.c)) {
          setDead(true);
          setRunning(false);
          setScore((sc) => { setBest((b) => Math.max(b, sc)); return sc; });
          return prev;
        }
        const ate = next.r === food.r && next.c === food.c;
        const newSnake = [next, ...prev];
        if (!ate) newSnake.pop(); else { setScore((s) => s + 1); setFood(randomFood(newSnake)); }
        return newSnake;
      });
    }, SPEED);
    return () => clearInterval(id);
  }, [running, dead, food]);

  const cellColor = (r: number, c: number): string => {
    if (snake[0]?.r === r && snake[0]?.c === c) return "#2e7d32";
    if (snake.some((s) => s.r === r && s.c === c)) return "#66bb6a";
    if (food.r === r && food.c === c) return "#e53935";
    return (r + c) % 2 === 0 ? "#f1f8e9" : "#e8f5e9";
  };

  return (
    <View>
      <View style={s.info}>
        <Text style={s.infoText}>Score: {score}</Text>
        <Text style={s.infoText}>Best: {best}</Text>
        <TouchableOpacity onPress={reset}><Ionicons name="refresh" size={20} color="#2e7d32" /></TouchableOpacity>
      </View>

      <View style={s.board}>
        {Array.from({ length: GRID }).map((_, r) => (
          <View key={r} style={s.row}>
            {Array.from({ length: GRID }).map((_, c) => (
              <View key={c} style={[s.cell, { backgroundColor: cellColor(r, c) }]} />
            ))}
          </View>
        ))}
        {dead && (
          <View style={s.overlay}>
            <Text style={s.overText}>Game Over</Text>
            <TouchableOpacity style={s.playBtn} onPress={reset}><Text style={s.playText}>Restart</Text></TouchableOpacity>
          </View>
        )}
        {!running && !dead && (
          <View style={s.overlay}>
            <TouchableOpacity style={s.playBtn} onPress={reset}><Text style={s.playText}>Start</Text></TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <View style={s.ctrlRow}>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => changeDir("UP")}><Ionicons name="chevron-up" size={22} color="#2e7d32" /></TouchableOpacity>
        </View>
        <View style={s.ctrlRow}>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => changeDir("LEFT")}><Ionicons name="chevron-back" size={22} color="#2e7d32" /></TouchableOpacity>
          <View style={s.ctrlSpacer} />
          <TouchableOpacity style={s.ctrlBtn} onPress={() => changeDir("RIGHT")}><Ionicons name="chevron-forward" size={22} color="#2e7d32" /></TouchableOpacity>
        </View>
        <View style={s.ctrlRow}>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => changeDir("DOWN")}><Ionicons name="chevron-down" size={22} color="#2e7d32" /></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = Math.floor(260 / GRID);

const s = StyleSheet.create({
  info: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
  infoText: { fontSize: 13, color: "#666", fontWeight: "600" },
  board: { alignSelf: "center", borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#c8e6c9", position: "relative" },
  row: { flexDirection: "row" },
  cell: { width: CELL_SIZE, height: CELL_SIZE },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  overText: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  playBtn: { backgroundColor: "#2e7d32", paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 },
  playText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  controls: { alignItems: "center", marginTop: 10 },
  ctrlRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  ctrlBtn: { width: 44, height: 38, backgroundColor: "#e8f5e9", borderRadius: 10, justifyContent: "center", alignItems: "center", margin: 2 },
  ctrlSpacer: { width: 44, height: 38 },
});

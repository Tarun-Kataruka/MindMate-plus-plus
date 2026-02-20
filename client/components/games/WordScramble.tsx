import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WORDS = [
  { word: "BREATHE", hint: "Inhale... exhale..." },
  { word: "CALM", hint: "Peace and quiet" },
  { word: "FOCUS", hint: "Concentrate your mind" },
  { word: "PEACE", hint: "Inner tranquility" },
  { word: "RELAX", hint: "Let go of tension" },
  { word: "HAPPY", hint: "Feeling of joy" },
  { word: "SMILE", hint: "Show your teeth :)" },
  { word: "DREAM", hint: "Imagine possibilities" },
  { word: "KINDNESS", hint: "Being nice to others" },
  { word: "MINDFUL", hint: "Present awareness" },
  { word: "GRATITUDE", hint: "Being thankful" },
  { word: "COURAGE", hint: "Facing your fears" },
  { word: "STRENGTH", hint: "Inner power" },
  { word: "HOPE", hint: "Light in darkness" },
  { word: "LOVE", hint: "The strongest emotion" },
];

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

function pickWord() {
  const { word, hint } = WORDS[Math.floor(Math.random() * WORDS.length)];
  return { word, hint, scrambled: shuffle(word.split("")) };
}

export default function WordScramble() {
  const [puzzle, setPuzzle] = useState(pickWord);
  const [selected, setSelected] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [streak, setStreak] = useState(0);

  const reset = useCallback(() => {
    setPuzzle(pickWord());
    setSelected([]);
    setWon(false);
  }, []);

  const tap = useCallback((i: number) => {
    if (won || selected.includes(i)) return;
    const next = [...selected, i];
    setSelected(next);
    const guess = next.map((idx) => puzzle.scrambled[idx]).join("");
    if (guess.length === puzzle.word.length) {
      if (guess === puzzle.word) {
        setWon(true);
        setStreak((s) => s + 1);
      } else {
        setTimeout(() => setSelected([]), 400);
      }
    }
  }, [won, selected, puzzle]);

  const undo = useCallback(() => {
    setSelected((p) => p.slice(0, -1));
  }, []);

  const answer = selected.map((i) => puzzle.scrambled[i]).join("");

  return (
    <View>
      <View style={s.info}>
        <Text style={s.infoText}>Streak: {streak}</Text>
        <TouchableOpacity onPress={reset}><Ionicons name="refresh" size={20} color="#ef6c00" /></TouchableOpacity>
      </View>

      <Text style={s.hint}>Hint: {puzzle.hint}</Text>

      {/* Answer slots */}
      <View style={s.answerRow}>
        {puzzle.word.split("").map((_, i) => (
          <View key={i} style={[s.slot, answer[i] && s.slotFilled]}>
            <Text style={s.slotText}>{answer[i] || ""}</Text>
          </View>
        ))}
        {selected.length > 0 && !won && (
          <TouchableOpacity onPress={undo} style={s.undoBtn}>
            <Ionicons name="backspace-outline" size={20} color="#ef6c00" />
          </TouchableOpacity>
        )}
      </View>

      {won ? (
        <View style={s.wonRow}>
          <Text style={s.wonText}>Correct! 🎉</Text>
          <TouchableOpacity style={s.nextBtn} onPress={reset}>
            <Text style={s.nextText}>Next Word</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.letters}>
          {puzzle.scrambled.map((letter, i) => (
            <TouchableOpacity
              key={i}
              style={[s.letterBtn, selected.includes(i) && s.letterUsed]}
              onPress={() => tap(i)}
              activeOpacity={0.7}
              disabled={selected.includes(i)}
            >
              <Text style={[s.letterText, selected.includes(i) && s.letterTextUsed]}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  info: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
  infoText: { fontSize: 13, color: "#666", fontWeight: "600" },
  hint: { fontSize: 13, color: "#888", fontStyle: "italic", textAlign: "center", marginBottom: 12 },
  answerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginBottom: 14 },
  slot: { width: 32, height: 38, borderBottomWidth: 2, borderBottomColor: "#ccc", justifyContent: "center", alignItems: "center" },
  slotFilled: { borderBottomColor: "#ef6c00" },
  slotText: { fontSize: 20, fontWeight: "800", color: "#333" },
  undoBtn: { marginLeft: 6 },
  letters: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  letterBtn: { width: 42, height: 42, backgroundColor: "#fff3e0", borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#ffe0b2" },
  letterUsed: { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },
  letterText: { fontSize: 18, fontWeight: "700", color: "#e65100" },
  letterTextUsed: { color: "#ccc" },
  wonRow: { alignItems: "center", paddingVertical: 10 },
  wonText: { fontSize: 16, fontWeight: "700", color: "#388e3c" },
  nextBtn: { backgroundColor: "#ef6c00", paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10, marginTop: 8 },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

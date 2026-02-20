import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface JournalItem {
  _id?: string;
  id?: string;
  title: string;
  date: string;
  summary: string;
}

interface JournalTabProps {
  data: JournalItem[];
  onPressItem?: (id: string) => void;
  onCreated?: (created: any) => void;
  onDeleted?: (id: string) => void;
}

const MOOD_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "leaf-outline",
  "heart-outline",
  "sparkles-outline",
  "sunny-outline",
  "flower-outline",
  "star-outline",
];

const ACCENT_COLORS = ["#6BCB77", "#42A5F5", "#AB47BC", "#FF7043", "#26C6DA", "#FFCA28"];

const JournalEntryItem: React.FC<{
  date: string;
  time?: string;
  title?: string;
  summary: string;
  index: number;
  onPress: () => void;
  onDelete?: () => void;
}> = ({ date, time, title, summary, index, onPress, onDelete }) => {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const icon = MOOD_ICONS[index % MOOD_ICONS.length];

  return (
    <TouchableOpacity style={styles.entryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.entryAccent, { backgroundColor: accent }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryTopRow}>
          <View style={[styles.entryIconCircle, { backgroundColor: accent + "18" }]}>
            <Ionicons name={icon} size={18} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.entryDate}>{date}</Text>
            {time ? <Text style={styles.entryTime}>{time}</Text> : null}
          </View>
          {!!onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={18} color="#e53935" />
            </TouchableOpacity>
          )}
        </View>
        {title ? (
          <Text style={styles.entryTitle} numberOfLines={1}>{title}</Text>
        ) : null}
        <Text style={styles.entrySummary} numberOfLines={3}>
          {summary}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const JournalTab: React.FC<JournalTabProps> = ({ data, onPressItem, onCreated, onDeleted }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ title: string; summary: string }>({ title: "", summary: "" });

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  const onSubmitCreate = async () => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      const res = await fetch(`${baseUrl}/api/journals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: form.title, summary: form.summary, date: todayStr, time: timeStr }),
      });
      if (!res.ok) throw new Error('Failed to create journal');
      const created = await res.json();
      onCreated && onCreated(created);
      setShowCreate(false);
      setForm({ title: '', summary: '' });
    } catch {}
  };

  const onDelete = async (id: string) => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      const res = await fetch(`${baseUrl}/api/journals/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to delete');
      onDeleted && onDeleted(id);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => (item._id || item.id) as string}
        renderItem={({ item, index }) => (
          <JournalEntryItem
            date={item.date}
            time={(item as any).time}
            title={item.title}
            summary={item.summary}
            index={index}
            onPress={() =>
              onPressItem && onPressItem((item._id || item.id) as string)
            }
            onDelete={() => onDelete((item._id || item.id) as string)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Ionicons name="book-outline" size={40} color="#c8e6c9" />
            </View>
            <Text style={styles.emptyTitle}>No journal entries yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to write your first entry
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Ionicons name="book-outline" size={22} color="#388e3c" />
              <Text style={styles.modalTitle}>New Journal Entry</Text>
            </View>
            <Text style={styles.modalDate}>{todayStr}</Text>
            <TextInput
              placeholder="Give it a title..."
              placeholderTextColor="#aaa"
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor="#aaa"
              style={[styles.input, styles.textArea]}
              multiline
              value={form.summary}
              onChangeText={(v) => setForm((f) => ({ ...f, summary: v }))}
            />
            <TouchableOpacity onPress={onSubmitCreate} style={styles.submitBtn} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>Save Entry</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default JournalTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  entryAccent: {
    width: 5,
  },
  entryContent: {
    flex: 1,
    padding: 14,
  },
  entryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  entryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  entryTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  entrySummary: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f8e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#555",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: "#77C272",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#388e3c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  modalDate: {
    fontSize: 13,
    color: "#999",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#388e3c",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

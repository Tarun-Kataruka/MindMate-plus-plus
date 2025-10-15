import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { Colors } from "@/constants/theme";

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

const JournalEntryItem: React.FC<{
  date: string;
  time?: string;
  title?: string;
  summary: string;
  onPress: () => void;
  onDelete?: () => void;
}> = ({ date, time, title, summary, onPress, onDelete }) => (
  <TouchableOpacity style={styles.entryCard} onPress={onPress}>
    <Text style={styles.entryDate}>{date}</Text>
    {time ? <Text style={styles.entryTime}>{time}</Text> : null}
    <View style={styles.separator} />
    {title ? (
      <Text style={styles.entryTitle} numberOfLines={1}>{title}</Text>
    ) : null}
    <Text style={styles.entrySummary} numberOfLines={3}>
      {summary}
    </Text>
    {!!onDelete && (
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

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
    } catch  {}
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
          }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.greeting}>Hi there!</Text>
          <Text style={styles.dateText}>{todayStr}</Text>
        </View>
      </View>

      {/* Journal List */}
      <FlatList
        data={data}
        keyExtractor={(item) => (item._id || item.id) as string}
        renderItem={({ item }) => (
          <JournalEntryItem
            date={item.date}
            time={(item as any).time}
            title={item.title}
            summary={item.summary}
            onPress={() =>
              onPressItem && onPressItem((item._id || item.id) as string)
            }
            onDelete={() => onDelete((item._id || item.id) as string)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
      />

      {/* Floating Add Button */}
       <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

       <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
         <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)}>
           <Pressable style={styles.modalCard} onPress={() => {}}>
             <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>New Journal</Text>
             <TextInput
               placeholder="Title"
               style={styles.input}
               value={form.title}
               onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
             />
             <TextInput
               placeholder="Summary"
               style={[styles.input, { height: 90 }]}
               multiline
               value={form.summary}
               onChangeText={(v) => setForm((f) => ({ ...f, summary: v }))}
             />
             <TouchableOpacity onPress={onSubmitCreate} style={styles.submitBtn}>
               <Text style={styles.submitText}>Save</Text>
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
    backgroundColor: Colors.surfaceBg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.journalHeaderBg,
    padding: 16,
    borderBottomRightRadius: 70,
    borderBottomLeftRadius: 0,
    marginBottom: 18,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    marginRight: 14,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutralText,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: Colors.neutralText,
    fontWeight: '400',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: Colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
  },
  entryCard: {
    backgroundColor: Colors.journalCardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.journalAccent,
  },
  entryTime: {
    fontSize: 13,
    color: Colors.journalAccent,
    marginBottom: 4,
  },
  separator: {
    height: 2,
    backgroundColor: Colors.journalSeparator,
    marginVertical: 6,
    width: '95%',
    alignSelf: 'flex-start',
    borderRadius: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  entrySummary: {
    fontSize: 14,
    color: Colors.neutralText,
    marginBottom: 2,
    letterSpacing: 0.15,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.journalHeaderBg,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.journalSeparator,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 19,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#388e3c',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 7,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

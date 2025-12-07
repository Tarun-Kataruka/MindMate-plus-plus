import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function Chat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', text: t("chat.welcomeMessage") },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Message>>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyByDate, setHistoryByDate] = useState<Record<string, Message[]>>({});
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');

  const dateKeyOf = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const groupByDate = (serverMessages: any[]): Record<string, Message[]> => {
      const grouped: Record<string, Message[]> = {};
      for (const m of serverMessages) {
        const createdAt = m.createdAt ? new Date(m.createdAt) : new Date();
        const key = dateKeyOf(createdAt);
        const role: 'user' | 'bot' = m.role === 'assistant' ? 'bot' : 'user';
        const msg: Message = {
          id: String(m.id || m._id || `${m.createdAt}-${m.role}`),
          role,
          text: String(m.text || m.content || ''),
        };
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(msg);
      }
      // Ensure chronological order within a day is preserved by server sort; fallback no-op
      return grouped;
    };
    const loadHistory = async () => {
      try {
        const token = (globalThis as any).authToken as string | undefined;
        if (!token) return;
        const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/chatbot/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const history = Array.isArray(data?.messages) ? data.messages : [];
        const grouped = groupByDate(history);
        setHistoryByDate(grouped);
        const todayKey = dateKeyOf(new Date());
        const firstKey = grouped[todayKey] ? todayKey : Object.keys(grouped).sort().pop();
        if (firstKey) {
          setSelectedDateKey(firstKey);
          setMessages(grouped[firstKey]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
        }
      } catch {
        // ignore
      }
    };
    loadHistory();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
      const token = (globalThis as any).authToken as string | undefined;
      const res = await fetch(`${baseUrl}/api/chatbot/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const replyText = (data?.reply as string) || t("chat.welcomeMessage");
      const reply: Message = { 
        id: String(Date.now() + 1), 
        role: 'bot', 
        text: replyText 
      };
      
      // Log the response source for debugging
      if (data.source) {
        console.log(`Chat response from: ${data.source} (AI: ${data.ai_enabled || false})`);
      }
      
      setMessages(prev => [...prev, reply]);
      listRef.current?.scrollToEnd({ animated: true });
    } catch (e: any) {
      const errMsg = typeof e?.message === 'string' ? e.message : t("chat.errorMessage");
      const reply: Message = { 
        id: String(Date.now() + 1), 
        role: 'bot', 
        text: `${t("chat.errorMessage")} ${errMsg.includes('HTTP') ? t("chat.tryAgain") : ''}` 
      };
      setMessages(prev => [...prev, reply]);
      listRef.current?.scrollToEnd({ animated: true });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.botText]}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerOpen(v => !v)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("chat.title")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      {drawerOpen ? (
        <View style={styles.drawer}>
          <Text style={styles.drawerTitle}>{t("chat.history")}</Text>
          <FlatList
            data={Object.keys(historyByDate).sort()}
            keyExtractor={(k) => k}
            renderItem={({ item }) => {
              const isSelected = item === selectedDateKey;
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDateKey(item);
                    setMessages(historyByDate[item] || []);
                    setDrawerOpen(false);
                    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
                  }}
                  style={[styles.drawerItem, isSelected ? styles.drawerItemActive : null]}
                >
                  <Text style={[styles.drawerItemText, isSelected ? styles.drawerItemTextActive : null]}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t("chat.typeMessage")}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#252525" />
          </View>
        ) : null}
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>{t("chat.send")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#fff',
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '80%',
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#77C272',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  bubbleText: {
    fontSize: 15,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#252525',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  loadingWrap: {
    marginRight: 8,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
  drawer: {
    position: 'absolute',
    top: 48,
    bottom: 60,
    left: 0,
    width: 260,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#eaeaea',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  drawerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  drawerItemActive: {
    backgroundColor: '#f4f4f4',
  },
  drawerItemText: {
    fontSize: 14,
    color: '#222',
  },
  drawerItemTextActive: {
    fontWeight: '700',
  },
});



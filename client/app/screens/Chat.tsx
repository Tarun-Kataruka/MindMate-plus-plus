import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', text: "Hi! I'm Mate. How can I help today?" },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Message>>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/chatbot/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const replyText = (data?.reply as string) || "I'm here with you. Could you share a bit more?";
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
      const errMsg = typeof e?.message === 'string' ? e.message : 'Something went wrong. Please try again.';
      const reply: Message = { 
        id: String(Date.now() + 1), 
        role: 'bot', 
        text: `I'm having trouble connecting right now, but I'm here with you. ${errMsg.includes('HTTP') ? 'Please try again in a moment.' : ''}` 
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
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
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
          <Text style={styles.sendText}>Send</Text>
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
});



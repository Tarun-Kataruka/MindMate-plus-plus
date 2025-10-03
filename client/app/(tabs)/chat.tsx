import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', text: "Hi! I'm Mate. How can I help today?" },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // simple placeholder bot reply; integrate backend later
    setTimeout(() => {
      const reply: Message = { id: String(Date.now() + 1), role: 'bot', text: 'Thanks for sharing. Tell me more.' };
      setMessages(prev => [...prev, reply]);
      listRef.current?.scrollToEnd({ animated: true });
    }, 300);
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
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});



import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '@/contexts/VoiceContext';
import { Colors } from '@/constants/theme';

export default function VoiceIndicator() {
  const { isStreaming, stopVoice } = useVoice();

  if (!isStreaming) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <TouchableOpacity style={styles.pill} onPress={stopVoice} activeOpacity={0.8}>
        <View style={styles.dot} />
        <Text style={styles.label}>Voice on</Text>
        <Ionicons name="close" size={18} color={Colors.neutralText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    gap: 8,
    ...Platform.select({
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    }),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  label: {
    fontSize: 14,
    color: Colors.neutralText,
    fontWeight: '500',
  },
});

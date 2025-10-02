import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MindMate++</Text>
      <Text style={styles.subtitle}>You are logged in.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.secondary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.black },
});

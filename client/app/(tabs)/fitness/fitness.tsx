import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessLifestyleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="pulse" size={80} color={Colors.secondary} style={styles.icon} />
        <Text style={styles.title}>Fitness & Lifestyles</Text>
        <Text style={styles.subtitle}>Tools and resources to support your physical and mental well-being.</Text>
        <Text style={styles.infoText}>Here you will find exercise plans, nutrition advice, and sleep tracking features.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.lightGrey,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: 'center',
  }
});

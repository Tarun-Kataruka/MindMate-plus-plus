import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AcademicPlannerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="calendar" size={80} color={Colors.secondary} style={styles.icon} />
        <Text style={styles.title}>Academic Planner</Text>
        <Text style={styles.subtitle}>Plan exams with Google Calendar and organize subject-wise notes.</Text>
        <Text style={styles.infoText}>Create subjects, upload notes into folders, and keep everything synced to your schedule.</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/planner/prepare')} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Prepare for Exam</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 12 }]} onPress={() => router.push('/(tabs)/planner/plan')} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>View Study Plan</Text>
          </TouchableOpacity>
        </View>
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
  icon: { marginBottom: 20 },
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
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  actions: { width: '100%', paddingHorizontal: 24 },
  primaryBtn: {
    backgroundColor: '#77C272',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryBtn: { borderWidth: 2, borderColor: '#77C272', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  secondaryText: { color: '#388e3c', fontWeight: '600', fontSize: 16 },
});



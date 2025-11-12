import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function AcademicPlannerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Decorative Header */}
      <LinearGradient 
        colors={['#6BCB77', '#4AAE63']} 
        style={styles.headerContainer}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="calendar-outline" size={85} color="#fff" />
        </View>

        <Text style={styles.headerTitle}>Academic Planner</Text>
        <Text style={styles.headerSubtitle}>
          Plan your study. Track your progress. Stay ahead.
        </Text>
      </LinearGradient>

      {/* Glass Panel */}
      <View style={styles.card}>
        <Text style={styles.description}>
          Organize your subjects, upload notes, create a study plan, and sync everything seamlessly with your schedule.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(tabs)/planner/prepare')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Prepare for Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(tabs)/planner/plan')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryText}>View Study Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Stylish Disclaimer Box */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="warning-outline" size={22} color="#8a6d00" style={{ marginRight: 8 }} />
        <Text style={styles.disclaimerText}>
          Study schedules are AI-generated for guidance only. Your progress depends on your own effort and consistency. For academic or mental health concerns, please consult a qualified professional.
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },

  // Header Section
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#4AAE63',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  iconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 80,
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },

  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Card Section
  card: {
    marginTop: -20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },

  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: '#6BCB77',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },

  secondaryBtn: {
    borderWidth: 2,
    borderColor: '#6BCB77',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#4AAE63',
    fontWeight: '700',
    fontSize: 17,
  },

  // Stylish Disclaimer
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 5,
    borderLeftColor: '#FBC02D',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 35,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#5f5f5f',
  },
});

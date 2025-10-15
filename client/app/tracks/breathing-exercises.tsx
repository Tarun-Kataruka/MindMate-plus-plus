import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/components/AudioPlayerProvider';

interface Track {
  id: string;
  title: string;
  duration: string;
  url: string;
}

export default function BreathingExercisesPage() {
  const router = useRouter();
  const { state, loadQueue, toggle } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: '3 Minute Breathing Space', duration: '3:00', url: '' },
    { id: '2', title: 'Still Mind Breath Awareness', duration: '6:00', url: '' },
    { id: '3', title: 'MARC 5 Minute Breathing', duration: '5:00', url: '' },
    { id: '4', title: 'Free Mindfulness 10 Minute', duration: '10:00', url: '' },
    { id: '5', title: 'Padraig Brief Mindfulness', duration: '4:00', url: '' },
    { id: '6', title: 'Padraig 10 Minute Breath', duration: '10:00', url: '' },
    { id: '7', title: 'Vidyamala Breathing Space', duration: '9:00', url: '' },
    { id: '8', title: '3 Minute Sounds', duration: '3:00', url: '' },
    { id: '9', title: 'Life Happens 5 Minute', duration: '5:00', url: '' },
    { id: '10', title: 'Breathing Space Long', duration: '8:00', url: '' },
  ];

  const sources = [
    require('../../assets/breathingExercises/FreeMindfulness3MinuteBreathingSpace.mp3'),
    require('../../assets/breathingExercises/StillMind6MinuteBreathAwareness.mp3'),
    require('../../assets/breathingExercises/MARC5MinuteBreathing.mp3'),
    require('../../assets/breathingExercises/FreeMindfulness10MinuteBreathing.mp3'),
    require('../../assets/breathingExercises/PadraigBriefMindfulnessPractice.mp3'),
    require('../../assets/breathingExercises/PadraigTenMinuteMindfulnessOfBreathing.mp3'),
    require('../../assets/breathingExercises/VidyamalaBreathingSpace.mp3'),
    require('../../assets/breathingExercises/FreeMindfulness3MinuteSounds.mp3'),
    require('../../assets/breathingExercises/LifeHappens5MinuteBreathing.mp3'),
    require('../../assets/breathingExercises/FreeMindfulness3MinuteBreathing.mp3'),
  ];

  const handlePlay = async (index: number) => {
    const queue = tracks.map((t, i) => ({ id: t.id, title: t.title, duration: t.duration, source: sources[i] }));
    await loadQueue(queue as any, index);
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breathing Exercises</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/breathing.jpeg')} style={styles.hero} resizeMode="cover" />
        <Text style={styles.sectionTitle}>Available Tracks</Text>

        {tracks.map((track, idx) => (
          <View key={track.id} style={styles.trackItem}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handlePlay(idx)}
            >
              <Ionicons name='play' size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#388e3c',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  hero: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f7f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#77C272',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 14,
    color: '#666',
  },
  controlButton: {
    backgroundColor: '#388e3c',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
  const { loadQueue } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: 'Success Affirmations', duration: '3:11', url: '' },
    { id: '2', title: 'Love Frequency 532Hz', duration: '5:40', url: '' },
    { id: '3', title: 'Inspiring Piano', duration: '4:20', url: '' },
    { id: '4', title: 'Melodic Deep House', duration: '6:02', url: '' },
    { id: '5', title: 'A New Life Begins', duration: '7:14', url: '' },
    { id: '6', title: 'Liebe in mir, Liebe in dir', duration: '5:31', url: '' },
    { id: '7', title: 'Mein Herz schlägt Reichtum', duration: '4:48', url: '' },
    { id: '8', title: 'Dunbarton Meditation', duration: '8:10', url: '' },
    { id: '9', title: 'Falkirk Meditation', duration: '6:19', url: '' },
    { id: '10', title: 'Kinross Meditation', duration: '9:55', url: '' },
  ];

  const sources = [
    require('../../assets/affirmations&positivity/success-affirmations-184606.mp3'),
    require('../../assets/affirmations&positivity/532hz-love-frequencyuplifting-deep-healing-euphoric-320326.mp3'),
    require('../../assets/affirmations&positivity/inspiring-piano-music-274764.mp3'),
    require('../../assets/affirmations&positivity/melodic-deep-house-music-by-the-beach-367349.mp3'),
    require('../../assets/affirmations&positivity/ein-neues-leben-beginnt-in-mir-413452.mp3'),
    require('../../assets/affirmations&positivity/liebe-in-mir-liebe-in-dir-413451.mp3'),
    require('../../assets/affirmations&positivity/mein-herz-schlagt-reichtum-382185.mp3'),
    require('../../assets/affirmations&positivity/dunbarton-meditation-yoga-relax-study-sleep-chillout-newage-music-233088.mp3'),
    require('../../assets/affirmations&positivity/falkirk-meditation-yoga-relax-study-sleep-chillout-newage-music-233089.mp3'),
    require('../../assets/affirmations&positivity/kinross-meditation-yoga-relax-study-sleep-chillout-newage-music-233093.mp3'),
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
        <Text style={styles.headerTitle}>Affirmation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/affirmation.jpeg')} style={styles.hero} resizeMode="cover" />
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

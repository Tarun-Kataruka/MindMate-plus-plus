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

export default function FocusProductivityPage() {
  const router = useRouter();
  const { loadQueue } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: 'Calm Piano Chords Lo-Fi', duration: '4:12', url: '' },
    { id: '2', title: 'Lo-Fi Pads and Rhodes', duration: '5:01', url: '' },
    { id: '3', title: 'Creative Focus Harmony', duration: '3:41', url: '' },
    { id: '4', title: 'Nocturnal Analog Pads', duration: '6:22', url: '' },
    { id: '5', title: 'Nocturnal Pads v2', duration: '5:59', url: '' },
    { id: '6', title: 'Peaceful Piano Study', duration: '3:56', url: '' },
    { id: '7', title: 'Playful Lo-Fi Piano', duration: '4:02', url: '' },
    { id: '8', title: 'Playful Lo-Fi v2', duration: '3:48', url: '' },
    { id: '9', title: 'Rise and Drive', duration: '3:10', url: '' },
    { id: '10', title: 'Warm Rhodes Textures', duration: '4:40', url: '' },
  ];

  const sources = [
    require('../../assets/focus&productivity/calm-piano-chords-and-lo-fi-beat-with-smooth-satisfying-focus-flow-411800.mp3'),
    require('../../assets/focus&productivity/warm-rhodes-piano-and-analog-synth-textures-for-deep-focus-flow-403534.mp3'),
    require('../../assets/focus&productivity/effortless-piano-and-guitar-harmony-for-bright-creative-focus-411830.mp3'),
    require('../../assets/focus&productivity/nocturnal-analog-synth-pads-with-soft-piano-chords-and-lo-fi-408032.mp3'),
    require('../../assets/focus&productivity/nocturnal-analog-synth-pads-with-soft-piano-chords-and-lo-fi-v2-408025.mp3'),
    require('../../assets/focus&productivity/peaceful-piano-instrumental-for-studying-and-focus-232535.mp3'),
    require('../../assets/focus&productivity/playful-lo-fi-piano-with-vinyl-crackle-and-mellow-focus-pads-416020.mp3'),
    require('../../assets/focus&productivity/playful-lo-fi-piano-with-vinyl-crackle-and-mellow-focus-pads-v2-416017.mp3'),
    require('../../assets/focus&productivity/rise-and-drive-251971.mp3'),
    require('../../assets/focus&productivity/calm-rhodes-piano-and-smooth-synth-pads-with-mellow-sub-bass-flow-416032.mp3'),
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
        <Text style={styles.headerTitle}>Focus & Productivity</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/focus.jpeg')} style={styles.hero} resizeMode="cover" />
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

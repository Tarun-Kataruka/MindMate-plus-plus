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

export default function MindBodyPage() {
  const router = useRouter();
  const { loadQueue } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: '432 Hz Alpha Waves', duration: '6:10', url: '' },
    { id: '2', title: 'Body Mind Spirit', duration: '4:18', url: '' },
    { id: '3', title: 'Calm Pulse Theta', duration: '5:44', url: '' },
    { id: '4', title: 'For Meditation', duration: '3:55', url: '' },
    { id: '5', title: 'Mindscape Theta', duration: '5:11', url: '' },
    { id: '6', title: 'Routine Vibe', duration: '2:56', url: '' },
    { id: '7', title: 'Delta Waves Quiet', duration: '8:01', url: '' },
    { id: '8', title: 'Slow Focus Piano', duration: '3:40', url: '' },
    { id: '9', title: 'Resonance Theta', duration: '5:27', url: '' },
    { id: '10', title: 'Theta Cure', duration: '5:33', url: '' },
  ];

  const sources = [
    require('../../assets/mind&body/432-hz-alpha-waves-heal-the-hole-body-spirit-216473.mp3'),
    require('../../assets/mind&body/bodymindspirit-376925.mp3'),
    require('../../assets/mind&body/calm-pulse-theta-waves-healing-deep-meditation-relax-music-healing-355319.mp3'),
    require('../../assets/mind&body/for-meditation-185727.mp3'),
    require('../../assets/mind&body/mindscape-theta-waves-healing-deep-meditation-relax-music-healing-355267.mp3'),
    require('../../assets/mind&body/routine-vibe-345935.mp3'),
    require('../../assets/mind&body/simply-meditation-series-delta-waves-for-quiet-contemplation-8559.mp3'),
    require('../../assets/mind&body/slow-focus-and-meditation-piano-163680.mp3'),
    require('../../assets/mind&body/the-resonance-theta-waves-healing-deep-meditation-relax-music-healing-355317.mp3'),
    require('../../assets/mind&body/thetacure-theta-waves-healing-deep-meditation-relax-music-healing-355243.mp3'),
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
        <Text style={styles.headerTitle}>Mind & Body</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/body.jpeg')} style={styles.hero} resizeMode="cover" />
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

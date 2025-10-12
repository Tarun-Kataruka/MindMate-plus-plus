import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface Track {
  id: string;
  title: string;
  duration: string;
  url: string;
}

export default function BreathingExercisesPage() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const tracks: Track[] = [
    {
      id: '1',
      title: '4-7-8 Breathing',
      duration: '5:00',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    },
    {
      id: '2',
      title: 'Box Breathing',
      duration: '8:00',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    },
    {
      id: '3',
      title: 'Deep Breathing',
      duration: '10:00',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    },
    {
      id: '4',
      title: 'Calming Breath',
      duration: '6:00',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    },
  ];

  const handlePlayPause = async (track: Track) => {
    try {
      if (playingTrack === track.id) {
        if (sound) {
          await sound.pauseAsync();
          setPlayingTrack(null);
        }
      } else {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: track.url });
        setSound(newSound);
        setPlayingTrack(track.id);
        await newSound.playAsync();
      }
    } catch (error) {
      console.log('Audio play error:', error);
    }
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
        <Text style={styles.sectionTitle}>Available Tracks</Text>

        {tracks.map((track) => (
          <View key={track.id} style={styles.trackItem}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handlePlayPause(track)}
            >
              <Ionicons
                name={playingTrack === track.id ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
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

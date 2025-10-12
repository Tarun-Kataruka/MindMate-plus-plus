import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Track {
  id: string;
  title: string;
  duration: string;
  file: any;
}

export default function YogaMeditationPage() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  const tracks: Track[] = [
    {
      id: '1',
      title: 'Peaceful Meditation',
      duration: '10:00',
      file: require('../../assets/meditation/meditation-music-409195.mp3'),
    },
  ];

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async (track: Track) => {
    try {
      if (sound) await sound.unloadAsync();

      const { sound: newSound } = await Audio.Sound.createAsync(track.file);
      setSound(newSound);
      setCurrentTrack(track.id);
      setIsPlaying(true);
      await newSound.playAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pause audio');
      console.error('Error pausing sound:', error);
    }
  };

  const resumeSound = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resume audio');
      console.error('Error resuming sound:', error);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yoga & Meditation</Text>
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

            <View style={styles.controls}>
              {currentTrack === track.id && isPlaying ? (
                <TouchableOpacity onPress={pauseSound}>
                  <Ionicons name="pause-circle" size={36} color="#388e3c" />
                </TouchableOpacity>
              ) : currentTrack === track.id && !isPlaying ? (
                <TouchableOpacity onPress={resumeSound}>
                  <Ionicons name="play-circle" size={36} color="#388e3c" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => playSound(track)}>
                  <Ionicons name="play-circle" size={36} color="#388e3c" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

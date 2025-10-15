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
  const { loadQueue, toggleFavorite, favorites } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: 'Soft Whispering', duration: '8:05', url: '' },
    { id: '2', title: 'Page Turning ASMR', duration: '6:50', url: '' },
    { id: '3', title: 'Gentle Tapping', duration: '9:15', url: '' },
    { id: '4', title: 'Hair Brushing Sounds', duration: '7:22', url: '' },
    { id: '5', title: 'Plastic Crinkles', duration: '5:49', url: '' },
    { id: '6', title: 'Keyboard Typing', duration: '10:12', url: '' },
    { id: '7', title: 'Rain on Window', duration: '12:48', url: '' },
    { id: '8', title: 'Fireplace Crackle', duration: '11:03', url: '' },
    { id: '9', title: 'Soft Brush on Mic', duration: '7:58', url: '' },
    { id: '10', title: 'Paper Wrinkling', duration: '6:31', url: '' },
  ];

  const localSources = [
    require('../../assets/asmrSounds/asmr-recording-from-august-28-2016.mp3'),
    require('../../assets/asmrSounds/024340-autonomous-sensory-meridian-response-asmr-tapping-session.mp3'),
    require('../../assets/asmrSounds/playing-with-a-ziplock-bag.mp3'),
    require('../../assets/asmrSounds/microphone-picking-up-facial-hair-sounds-stereo-panned.mp3'),
    require('../../assets/asmrSounds/sounds-of-sipping.mp3'),
    require('../../assets/asmrSounds/cat-purring-sound-01.mp3'),
    require('../../assets/asmrSounds/sound-of-drinking-water-with-ice-cubes.mp3'),
    require('../../assets/asmrSounds/slicing-mango-1-on-a-plate.mp3'),
    require('../../assets/asmrSounds/providing-food-to-a-cat.mp3'),
    require('../../assets/asmrSounds/cascade-of-water.mp3'),
  ];

  const handlePlay = async (index: number) => {
    const queue = tracks.map((t, i) => ({ id: t.id, title: t.title, duration: t.duration, source: localSources[i] }));
    await loadQueue(queue as any, index);
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ASMR</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/asmr.jpeg')} style={styles.hero} resizeMode="cover" />
        <Text style={styles.sectionTitle}>Available Tracks</Text>

        {tracks.map((track, idx) => (
          <View key={track.id} style={styles.trackItem}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => toggleFavorite({ id: track.id, title: track.title, source: localSources[idx] })} style={[styles.iconBtn, { marginRight: 10 }]}>
                <Ionicons name={favorites[track.id] ? 'heart' : 'heart-outline'} size={22} color={favorites[track.id] ? '#ff4d4f' : '#388e3c'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handlePlay(idx)}
              >
                <Ionicons name='play' size={24} color="#fff" />
              </TouchableOpacity>
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
  iconBtn: { padding: 6 },
});

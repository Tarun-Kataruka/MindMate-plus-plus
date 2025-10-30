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

export default function YogaMeditationPage() {
  const router = useRouter();
  const { loadQueue, toggleFavorite, favorites } = useAudioPlayer();

  const tracks: Track[] = [
    { id: '1', title: 'Meditation Lofi Yoga', duration: '4:01', url: '' },
    { id: '2', title: 'Meditation Music', duration: '5:21', url: '' },
    { id: '3', title: 'Relax Yoga Meditation', duration: '4:36', url: '' },
    { id: '4', title: 'Relax Peaceful Yoga', duration: '3:40', url: '' },
    { id: '5', title: 'Spring Breeze Meditation', duration: '6:05', url: '' },
    { id: '6', title: 'Spring Breeze Meditation v2', duration: '6:05', url: '' },
    { id: '7', title: 'Yoga', duration: '2:42', url: '' },
    { id: '8', title: 'Yoga Meditation Relax', duration: '4:18', url: '' },
    { id: '9', title: 'Yoga Relax Meditation', duration: '4:55', url: '' },
    { id: '10', title: 'Yoga Relaxing Music', duration: '3:50', url: '' },
  ];

  const sources = [
    require('../../assets/yoga&meditation/meditation-lofi-yoga-relax-lofi-music-247404.mp3'),
    require('../../assets/yoga&meditation/meditation-music-409195.mp3'),
    require('../../assets/yoga&meditation/meditation-relax-yoga-music-381876.mp3'),
    require('../../assets/yoga&meditation/relax-yoga-peaceful-meditation-background-music-247405.mp3'),
    require('../../assets/yoga&meditation/spring-breeze-of-meditation-background-music-for-yoga-and-meditation-200225.mp3'),
    require('../../assets/yoga&meditation/spring-breeze-of-meditation-background-music-for-yoga-and-meditation-200225 (1).mp3'),
    require('../../assets/yoga&meditation/yoga-417222.mp3'),
    require('../../assets/yoga&meditation/yoga-meditation-relax-music-359352.mp3'),
    require('../../assets/yoga&meditation/yoga-relax-meditation-music-372011.mp3'),
    require('../../assets/yoga&meditation/yoga-relaxing-yoga-music-413542.mp3'),
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
        <Text style={styles.headerTitle}>Yoga & Meditation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/yoga_main.jpg')} style={styles.hero} resizeMode="cover" />
        <Text style={styles.sectionTitle}>Available Tracks</Text>

        {tracks.map((track, idx) => (
          <View key={track.id} style={styles.trackItem}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => toggleFavorite({ id: track.id, title: track.title, source: sources[idx] })} style={{ padding: 6, marginRight: 10 }}>
                <Ionicons name={favorites[track.id] ? 'heart' : 'heart-outline'} size={22} color={favorites[track.id] ? '#ff4d4f' : '#388e3c'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controls} onPress={() => handlePlay(idx)}>
                <Ionicons name="play-circle" size={36} color="#388e3c" />
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

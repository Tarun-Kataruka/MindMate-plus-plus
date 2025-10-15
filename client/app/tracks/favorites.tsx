import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/components/AudioPlayerProvider';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, loadQueue } = useAudioPlayer();
  const favList = Object.values(favorites);

  const handlePlay = async (index: number) => {
    await loadQueue(favList, index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../assets/snoop.gif')} style={styles.hero} resizeMode="cover" />
        <Text style={styles.sectionTitle}>Your Saved Tracks</Text>
        {favList.length === 0 ? (
          <Text style={{ color: '#666' }}>No favorites yet. Tap hearts to save tracks.</Text>
        ) : (
          favList.map((track, idx) => (
            <View key={track.id} style={styles.trackItem}>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{track.title}</Text>
              </View>
              <TouchableOpacity style={styles.controlButton} onPress={() => handlePlay(idx)}>
                <Ionicons name='play' size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#388e3c' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  hero: { width: '100%', height: 160, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 12 },
  trackItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f3f7f5', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#77C272', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 4 },
  controlButton: { backgroundColor: '#388e3c', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});



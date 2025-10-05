import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

// Mock data for the Journals list, matching the structure shown in the UI screenshots
const MOCK_JOURNALS = [
  { id: '1', title: 'A Day of Gratitude', date: 'Oct 23', summary: 'Focused on the small joys and peaceful moments. Felt a sense of calm resilience today.' },
  { id: '2', title: 'Handling Stress', date: 'Oct 22', summary: 'Wrote about a challenging work situation. Identified my triggers and planned proactive steps for tomorrow.' },
  { id: '3', title: 'Morning Reflection', date: 'Oct 21', summary: 'Setting intentions for a productive day. Focused on health goals and self-care.' },
  { id: '4', title: 'Weekend Vibes', date: 'Oct 20', summary: 'Recap of the hiking trip. Loved the fresh air and disconnecting from technology.' },
];

/**
 * Journal Entry List Item Component
 */
const JournalEntryItem = ({ title, date, summary, onPress }: { title: string, date: string, summary: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.entryCard} onPress={onPress}>
    <View style={styles.entryHeader}>
      <Text style={styles.entryDate}>{date}</Text>
      <Text style={styles.entryTitle} numberOfLines={1}>{title}</Text>
    </View>
    <Text style={styles.entrySummary} numberOfLines={2}>{summary}</Text>
  </TouchableOpacity>
);

/**
 * Main Journals Screen Component
 */
export default function JournalsScreen() {
  // Navigation function (placeholder)
  const handleNewEntry = () => {
    // Navigate to a new journal entry creation screen
    console.log('Navigate to New Journal Entry Screen');
    // Example: router.push('/new-journal-entry');
  };

  const handleEntryPress = (id: string) => {
    // Navigate to the detailed entry view
    console.log('View Journal Entry:', id);
    // Example: router.push(`/journal/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header: Matches UI screenshot (Avatar + Title + Add Button) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Placeholder for Profile Avatar/Image */}
          <Image
            source={{ uri: 'https://placehold.co/40x40/52528C/FFFFFF/png?text=P' }} 
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>Journals</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleNewEntry}>
          <Ionicons name="add-circle" size={40} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Journals List */}
      <FlatList
        data={MOCK_JOURNALS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JournalEntryItem
            title={item.title}
            date={item.date}
            summary={item.summary}
            onPress={() => handleEntryPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background, // Assuming a light background
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    padding: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    flexShrink: 1, 
  },
  entrySummary: {
    fontSize: 14,
    color: Colors.lightGrey,
    marginTop: 5,
  },
});

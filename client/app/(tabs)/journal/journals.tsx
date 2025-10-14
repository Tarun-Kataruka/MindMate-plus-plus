import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import JournalTab from '../../../components/journal/JournalTab';
import BlogTab from '../../../components/journal/BlogTab';

type TabKey = 'BLOGS' | 'JOURNALS';

export default function JournalsMainScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('JOURNALS');
  const [journals, setJournals] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = useMemo(() => (['BLOGS', 'JOURNALS'] as TabKey[]), []);

  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (activeTab === 'JOURNALS') {
          const token = (globalThis as any).authToken as string | undefined;
          const res = await fetch(`${baseUrl}/api/journals`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const data = await res.json();
          setJournals(Array.isArray(data) ? data : []);
        } else {
          const res = await fetch(`${baseUrl}/api/blogs`);
          const data = await res.json();
          setBlogs(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        setError('Failed to load data');
        console.error('Failed to fetch tabs data:', e?.message || e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, baseUrl]);

  const handleJournalCreated = (created: any) => setJournals((prev) => [created, ...prev]);
  const handleJournalDeleted = (id: string) => setJournals((prev) => prev.filter((j) => (j._id || j.id) !== id));
  const handleBlogCreated = (created: any) => setBlogs((prev) => [created, ...prev]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <View style={styles.tabContentWrap}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}
                </Text>
                {isActive && <View style={styles.activeUnderline} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#2196F3" style={{ marginTop: 20 }} />
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#d32f2f' }}>{error}</Text>
        </View>
      ) : activeTab === 'JOURNALS' ? (
        <JournalTab data={journals} onPressItem={(id) => console.log('View Journal:', id)} onCreated={handleJournalCreated} onDeleted={handleJournalDeleted} />
      ) : (
        <BlogTab data={blogs} onCreated={handleBlogCreated} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#77C272',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabContentWrap: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  activeUnderline: {
    height: 2,
    width: '100%',
    backgroundColor: '#2196F3',
    marginTop: 6,
  },
});

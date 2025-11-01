import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import * as Linking from 'expo-linking';

type PlanItem = { title: string; start: string | Date; end: string | Date; subjectId?: string };

export default function PlanScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<PlanItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [connected] = React.useState<boolean>(false);
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  const token = (globalThis as any).authToken as string | undefined;
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI as string | undefined;

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/api/planner/plan`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const data = await res.json();
        const arr: PlanItem[] = Array.isArray(data?.items) ? data.items : [];
        setItems(arr);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [baseUrl, token]);

  const grouped = React.useMemo(() => {
    const map: Record<string, PlanItem[]> = {};
    items.forEach((i) => {
      const d = new Date(i.start);
      const key = d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      (map[key] = map[key] || []).push(i);
    });
    return Object.entries(map).map(([day, entries]) => ({ day, entries: entries.sort((a, b) => +new Date(a.start) - +new Date(b.start)) }));
  }, [items]);

  const [authInFlight, setAuthInFlight] = React.useState(false);

  const connectGoogle = async () => {
    try {
      if (authInFlight) return;
      setAuthInFlight(true);
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=${scope}&access_type=offline&prompt=consent`;
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        await Linking.openURL(authUrl);
      }
    } catch(error) {
      console.log('Error during Google OAuth:', error);
    }
    finally { setAuthInFlight(false); }
  };

  const pushPlan = async () => {
    try {
      setSyncing(true);
      const resp = await fetch(`${baseUrl}/api/planner/google/push`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert('Pushed', `Created ${data?.created ?? 0} events in your Google Calendar.`);
      } else {
        Alert.alert('Error', data?.message || 'Failed to push plan');
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#77C272" />
      ) : (
      <FlatList
        data={grouped}
        keyExtractor={(s) => s.day}
        renderItem={({ item }) => (
          <View style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{item.day}</Text>
            {item.entries.map((e, idx) => (
              <View key={idx} style={styles.entryRow}>
                <Text style={styles.entryTime}>{new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <Text style={styles.entryTitle}>{e.title}</Text>
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      )}

      <View style={styles.footer}>
        <View style={styles.statusCard}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#77C272' : '#ff9800' }]} />
          <Text style={styles.statusText}>{connected ? 'Google Calendar connected' : 'Not connected'}</Text>
        </View>
        <TouchableOpacity style={styles.pushBtn} onPress={connectGoogle}>
          <Ionicons name="logo-google" size={18} color="#fff" />
          <Text style={styles.pushText}>Connect Google Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pushBtn, { marginTop: 10, opacity: syncing ? 0.7 : 1 }]} onPress={pushPlan} disabled={syncing}>
          <Ionicons name="cloud-upload" size={18} color="#fff" />
          <Text style={styles.pushText}>{syncing ? 'Pushing…' : 'Push Plan to Google'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  backButton: { padding: 6 },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '600', color: '#388e3c', fontSize: 16 },
  dayBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  dayTitle: { color: '#388e3c', fontWeight: '700', marginBottom: 8 },
  entryRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  entryTime: { color: '#666', marginBottom: 2 },
  entryTitle: { color: Colors.light.text, fontWeight: '600' },
  footer: { padding: 16 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#388e3c', fontWeight: '600' },
  pushBtn: { backgroundColor: '#77C272', paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pushText: { color: '#fff', fontWeight: '600' },
});



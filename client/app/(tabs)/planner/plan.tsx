import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import * as Linking from 'expo-linking';

type PlanItem = { _id?: string; title: string; start: string | Date; end: string | Date; subjectId?: string; completed?: boolean };

export default function PlanScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<PlanItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  const token = (globalThis as any).authToken as string | undefined;
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI as string | undefined;

  const checkGoogleStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/planner/google/status`, { 
        headers: token ? { Authorization: `Bearer ${token}` } : undefined 
      });
      if (res.ok) {
        const data = await res.json();
        setConnected(data?.connected === true);
      }
    } catch (err) {
      console.error('Error checking Google status:', err);
      setConnected(false);
    }
  }, [baseUrl, token]);

  const loadPlan = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/planner/plan`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const data = await res.json();
      const arr: PlanItem[] = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
    } catch (err) {
      console.error('Error loading plan:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, token]);

  React.useEffect(() => {
    loadPlan();
    checkGoogleStatus();
  }, [loadPlan, checkGoogleStatus]);

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

  // Check Google status when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      checkGoogleStatus();
      loadPlan();
    }, [checkGoogleStatus, loadPlan])
  );

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
    if (!connected) {
      Alert.alert('Not Connected', 'Please connect your Google Calendar first.');
      return;
    }
    try {
      setSyncing(true);
      const resp = await fetch(`${baseUrl}/api/planner/google/push`, { 
        method: 'POST', 
        headers: token ? { Authorization: `Bearer ${token}` } : undefined 
      });
      const data = await resp.json();
      if (resp.ok) {
        Alert.alert('Success', `Created ${data?.created ?? 0} out of ${data?.total ?? 0} events in your Google Calendar.`);
      } else {
        Alert.alert('Error', data?.message || 'Failed to push plan to Google Calendar');
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          console.error('Push errors:', data.errors);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to push plan');
    } finally {
      setSyncing(false);
    }
  };

  const toggleCompletion = async (itemId?: string, nextValue?: boolean) => {
    if (!itemId || typeof nextValue !== 'boolean') return;
    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, completed: nextValue } : it))
    );
    try {
      const resp = await fetch(`${baseUrl}/api/planner/plan/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ completed: nextValue }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to update task');
      }
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) => (it._id === itemId ? { ...it, completed: !nextValue } : it))
      );
      Alert.alert('Error', err?.message || 'Failed to update task');
    }
  };

  const disconnectGoogle = async () => {
    try {
      const resp = await fetch(`${baseUrl}/api/planner/google/disconnect`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to disconnect Google Calendar');
      }
      setConnected(false);
      Alert.alert('Disconnected', 'Google Calendar has been disconnected.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not disconnect Google Calendar');
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
              <View key={e._id || idx} style={styles.entryRow}>
                <TouchableOpacity
                  style={[styles.checkboxContainer, e.completed ? styles.completedBackground : null]}
                  onPress={() => toggleCompletion(e._id, !e.completed)}
                >
                  <View style={[styles.checkbox, e.completed && styles.checkboxChecked]}>
                    {e.completed ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTime, e.completed && styles.completedText]}>
                      {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.entryTitle, e.completed && styles.completedText]}>{e.title}</Text>
                  </View>
                </TouchableOpacity>
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
        {connected ? (
          <>
            <TouchableOpacity style={[styles.pushBtn, styles.disconnectBtn]} onPress={disconnectGoogle}>
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.pushText}>Disconnect Google Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pushBtn, { marginTop: 10, opacity: syncing ? 0.7 : 1 }]} onPress={pushPlan} disabled={syncing}>
              <Ionicons name="cloud-upload" size={18} color="#fff" />
              <Text style={styles.pushText}>{syncing ? 'Pushing…' : 'Push Plan to Google'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.pushBtn} onPress={connectGoogle}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.pushText}>Connect Google Calendar</Text>
          </TouchableOpacity>
        )}
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
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#77C272', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#77C272', borderColor: '#77C272' },
  entryTime: { color: '#666', marginBottom: 2 },
  entryTitle: { color: Colors.light.text, fontWeight: '600' },
  completedText: { color: '#9e9e9e', textDecorationLine: 'line-through' },
  completedBackground: { backgroundColor: '#f1f8e9' },
  footer: { padding: 16 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#388e3c', fontWeight: '600' },
  pushBtn: { backgroundColor: '#77C272', paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  disconnectBtn: { backgroundColor: '#ff6b6b' },
  pushText: { color: '#fff', fontWeight: '600' },
});



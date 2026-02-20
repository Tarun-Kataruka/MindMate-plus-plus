import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import * as Linking from "expo-linking";

type PlanItem = {
  _id?: string;
  title: string;
  start: string | Date;
  end: string | Date;
  subjectId?: string;
  completed?: boolean;
};

export default function PlanScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<PlanItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [connected, setConnected] = React.useState<boolean>(false);
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = React.useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const token = (globalThis as any).authToken as string | undefined;
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI as string | undefined;

  const checkGoogleStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/planner/google/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setConnected(data?.connected === true);
      }
    } catch (err) {
      console.error("Error checking Google status:", err);
      setConnected(false);
    }
  }, [baseUrl, token]);

  const loadPlan = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/planner/plan`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      const arr: PlanItem[] = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
    } catch (err) {
      console.error("Error loading plan:", err);
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
      const key = d.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      (map[key] = map[key] || []).push(i);
    });
    return Object.entries(map).map(([day, entries]) => ({
      day,
      entries: entries.sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    }));
  }, [items]);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const [authInFlight, setAuthInFlight] = React.useState(false);

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
      const scope = encodeURIComponent(
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
      );
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(
        clientId || ""
      )}&redirect_uri=${encodeURIComponent(
        redirectUri || ""
      )}&scope=${scope}&access_type=offline&prompt=consent`;
      if (Platform.OS === "web") {
        window.location.href = authUrl;
      } else {
        await Linking.openURL(authUrl);
      }
    } catch (error) {
      console.log("Error during Google OAuth:", error);
    } finally {
      setAuthInFlight(false);
    }
  };

  const pushPlan = async () => {
    if (!connected) {
      Alert.alert("Not Connected", "Please connect your Google Calendar first.");
      return;
    }
    try {
      setSyncing(true);
      const resp = await fetch(`${baseUrl}/api/planner/google/push`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json();
      if (resp.ok) {
        const eventsCreated = data?.created ?? 0;
        const successMessage = `${eventsCreated} event${eventsCreated !== 1 ? "s" : ""} synced to Google Calendar`;
        setSyncSuccess({ show: true, message: successMessage });
        setTimeout(() => setSyncSuccess({ show: false, message: "" }), 3500);
      } else {
        Alert.alert("Error", data?.message || "Failed to push plan to Google Calendar");
        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          console.error("Push errors:", data.errors);
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to push plan");
    } finally {
      setSyncing(false);
    }
  };

  const toggleCompletion = async (itemId?: string, nextValue?: boolean) => {
    if (!itemId || typeof nextValue !== "boolean") return;
    setItems((prev) =>
      prev.map((it) => (it._id === itemId ? { ...it, completed: nextValue } : it))
    );
    try {
      const resp = await fetch(`${baseUrl}/api/planner/plan/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ completed: nextValue }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update task");
      }
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) => (it._id === itemId ? { ...it, completed: !nextValue } : it))
      );
      Alert.alert("Error", err?.message || "Failed to update task");
    }
  };

  const disconnectGoogle = async () => {
    try {
      const resp = await fetch(`${baseUrl}/api/planner/google/disconnect`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to disconnect Google Calendar");
      }
      setConnected(false);
      Alert.alert("Disconnected", "Google Calendar has been disconnected.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not disconnect Google Calendar");
    }
  };

  const DAY_COLORS = ["#6BCB77", "#42A5F5", "#AB47BC", "#FF7043", "#26C6DA", "#FFCA28", "#EC407A"];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Success Banner */}
      {syncSuccess.show && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.successBannerText}>{syncSuccess.message}</Text>
        </View>
      )}

      {/* Header */}
      <LinearGradient colors={["#6BCB77", "#4AAE63"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Study Plan</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress Card */}
      {totalCount > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalCount} tasks
              </Text>
            </View>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#77C272" size="large" />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCircle}>
            <Ionicons name="calendar-outline" size={44} color="#c8e6c9" />
          </View>
          <Text style={styles.emptyTitle}>No study plan yet</Text>
          <Text style={styles.emptyText}>Create one from the Prepare for Exam page</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(s) => s.day}
          renderItem={({ item, index }) => {
            const dayColor = DAY_COLORS[index % DAY_COLORS.length];
            const dayCompleted = item.entries.filter((e) => e.completed).length;
            const dayTotal = item.entries.length;
            return (
              <View style={styles.dayBlock}>
                <View style={styles.dayHeader}>
                  <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
                  <Text style={[styles.dayTitle, { color: dayColor }]}>{item.day}</Text>
                  <Text style={styles.dayCounter}>{dayCompleted}/{dayTotal}</Text>
                </View>
                {item.entries.map((e, idx) => (
                  <TouchableOpacity
                    key={e._id || idx}
                    style={[styles.entryRow, e.completed && styles.entryRowCompleted]}
                    onPress={() => toggleCompletion(e._id, !e.completed)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, e.completed && styles.checkboxChecked]}>
                      {e.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.entryTitle, e.completed && styles.completedText]}>
                        {e.title}
                      </Text>
                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={13} color={e.completed ? "#bbb" : "#999"} />
                        <Text style={[styles.entryTime, e.completed && styles.completedText]}>
                          {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Google Calendar Footer */}
      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? "#4caf50" : "#ff9800" }]} />
            <Text style={styles.statusText}>
              {connected ? "Google Calendar connected" : "Not connected"}
            </Text>
          </View>
          {connected ? (
            <View style={styles.footerBtnRow}>
              <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectGoogle} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={16} color="#e53935" />
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pushBtn, { opacity: syncing ? 0.7 : 1 }]}
                onPress={pushPlan}
                disabled={syncing}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={styles.pushText}>{syncing ? "Syncing..." : "Push to Google"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={connectGoogle} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={16} color="#fff" />
              <Text style={styles.connectText}>Connect Google Calendar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7FDF7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  progressCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  progressCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4AAE63",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    backgroundColor: "#6BCB77",
    borderRadius: 4,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 20,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f1f8e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dayBlock: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  dayCounter: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  entryRowCompleted: {
    backgroundColor: "#f9fdf9",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#77C272",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#77C272",
    borderColor: "#77C272",
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryTime: {
    fontSize: 13,
    color: "#999",
  },
  completedText: {
    color: "#bbb",
    textDecorationLine: "line-through",
  },
  footer: {
    padding: 16,
    paddingTop: 8,
  },
  footerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  footerBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  disconnectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffebee",
    paddingVertical: 12,
    borderRadius: 12,
  },
  disconnectText: {
    color: "#e53935",
    fontWeight: "600",
    fontSize: 13,
  },
  pushBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#77C272",
    paddingVertical: 12,
    borderRadius: 12,
  },
  pushText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    borderRadius: 14,
  },
  connectText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  successBanner: {
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successBannerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
});

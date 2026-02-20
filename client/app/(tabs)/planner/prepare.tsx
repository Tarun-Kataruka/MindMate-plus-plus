import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Linking,
  Platform,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";

type Subject = { id?: string; _id?: string; name: string };

export default function PrepareExamScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [notesCount, setNotesCount] = useState<Record<string, number>>({});
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerItems, setViewerItems] = useState<
    { originalName: string; url: string; _id?: string; name?: string }[]
  >([]);
  const [viewerKind, setViewerKind] = useState<
    "subject" | "materials" | "datesheets"
  >("subject");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dailyStartTime, setDailyStartTime] = useState("09:00");
  const [dailyEndTime, setDailyEndTime] = useState("17:00");
  const [numDays, setNumDays] = useState("30");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const baseUrl = useMemo(
    () => (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
    []
  );
  const token = (globalThis as any).authToken as string | undefined;

  const loadNotesForSubject = useCallback(
    async (subjectId?: string) => {
      if (!subjectId) return;
      try {
        const res = await fetch(
          `${baseUrl}/api/planner/notes?subjectId=${encodeURIComponent(subjectId)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        const items = await res.json();
        setNotesCount((prev) => ({
          ...prev,
          [subjectId]: Array.isArray(items) ? items.length : 0,
        }));
      } catch {}
    },
    [baseUrl, token]
  );

  const loadSubjects = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/planner/subjects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
      if (Array.isArray(data)) {
        data.forEach((s: any) => loadNotesForSubject(s._id || s.id));
      }
    } catch {}
  }, [baseUrl, token, loadNotesForSubject]);

  React.useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const res = await fetch(`${baseUrl}/api/planner/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newSubject.trim() }),
      });
      const created = await res.json();
      setSubjects((p) => [created, ...p]);
      setNewSubject("");
    } catch {}
  };

  const deleteSubject = async (subjectId?: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(
        `${baseUrl}/api/planner/deletesubject/${encodeURIComponent(subjectId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to delete subject");
      setSubjects((prev) => prev.filter((s) => (s._id || s.id) !== subjectId));
      setNotesCount((prev) => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    } catch (err: any) {
      console.error("Delete error:", err);
    }
  };

  const openUrl = async (url: string) => {
    const absolute = url.startsWith("http") ? url : `${baseUrl}${url}`;
    try {
      await Linking.openURL(absolute);
    } catch {}
  };

  const openSubjectViewer = async (subjectId?: string, title?: string) => {
    if (!subjectId) return;
    try {
      const res = await fetch(
        `${baseUrl}/api/planner/notes?subjectId=${encodeURIComponent(subjectId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const items = await res.json();
      setViewerTitle(`${title || "Subject"} Files`);
      setViewerItems(Array.isArray(items) ? items : []);
      setViewerKind("subject");
      setSelected(new Set());
      setViewerVisible(true);
    } catch {}
  };

  const openGeneralViewer = async (endpoint: string, title: string) => {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const items = await res.json();
      setViewerTitle(title);
      setViewerItems(Array.isArray(items) ? items : []);
      setViewerKind(endpoint.includes("datesheet") ? "datesheets" : "materials");
      setSelected(new Set());
      setViewerVisible(true);
    } catch {}
  };

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      if (viewerKind === "subject") {
        const ids = viewerItems
          .filter((i) => i._id && selected.has(i._id))
          .map((i) => i._id as string);
        await fetch(`${baseUrl}/api/planner/notes`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ids }),
        });
        const sid = (
          subjects.find((s) => `${s._id || s.id} Files` === viewerTitle) as any
        )?._id;
        if (sid) loadNotesForSubject(sid);
      } else if (viewerKind === "materials") {
        const names = viewerItems
          .filter((i) => i.name && selected.has(i.name))
          .map((i) => i.name as string);
        await fetch(`${baseUrl}/api/planner/materials`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ names }),
        });
      } else {
        const names = viewerItems
          .filter((i) => i.name && selected.has(i.name))
          .map((i) => i.name as string);
        await fetch(`${baseUrl}/api/planner/datesheet`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ names }),
        });
      }
      if (viewerKind === "subject") {
        setViewerVisible(false);
        loadSubjects();
      } else if (viewerKind === "materials") {
        openGeneralViewer("/api/planner/materials", "Materials");
      } else {
        openGeneralViewer("/api/planner/datesheet", "Date Sheets");
      }
    } catch {}
  };

  const uploadFile = async (
    endpoint: string,
    extraForm?: Record<string, string>
  ) => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (pick.canceled || !pick.assets?.length) return;

      const form = new FormData();
      pick.assets.forEach((asset: any) => {
        const name = asset.name || "file";
        const type = asset.mimeType || "application/octet-stream";
        if (asset.file instanceof File) {
          form.append("files", asset.file as File, name);
        } else {
          // @ts-ignore
          form.append("files", { uri: asset.uri, name, type } as any);
        }
      });
      Object.entries(extraForm || {}).forEach(([k, v]) =>
        form.append(k, v as any)
      );

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form as any,
      });
      if (!res.ok) throw new Error("Upload failed");
      Alert.alert("Uploaded", "Your file(s) were uploaded successfully.");
      const subjectId = (extraForm && extraForm.subjectId) || undefined;
      if (subjectId) loadNotesForSubject(subjectId);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to upload");
    }
  };

  const createPlan = async () => {
    try {
      setLoading(true);
      const subjectList = subjects.map((s) => s.name).filter(Boolean);
      if (subjectList.length === 0) {
        Alert.alert("Error", "Please add at least one subject before planning.");
        return;
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dailyStartTime) || !timeRegex.test(dailyEndTime)) {
        Alert.alert("Error", "Please enter valid time format (HH:MM)");
        return;
      }

      const days = parseInt(numDays, 10);
      if (isNaN(days) || days < 1) {
        Alert.alert("Error", "Number of days must be at least 1");
        return;
      }

      const startDateToUse = new Date().toISOString().split("T")[0];

      let datesheetPath = "";
      try {
        const datesheetRes = await fetch(`${baseUrl}/api/planner/datesheet`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const datesheets = await datesheetRes.json();
        if (Array.isArray(datesheets) && datesheets.length > 0) {
          datesheetPath = datesheets[0].url || "";
        }
      } catch {}

      const res = await fetch(`${baseUrl}/api/planner/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subjects: subjectList,
          dailyStartTime,
          dailyEndTime,
          numDays: days,
          startDate: startDateToUse,
          datesheetPath: datesheetPath || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create plan");
      }
      if (Platform.OS === "android") {
        ToastAndroid.show(
          `Study plan created for ${days} days from ${startDateToUse}`,
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert(
          "Plan Created",
          `Study plan generated for ${days} days starting from ${startDateToUse}.`
        );
      }
      router.push("/(tabs)/planner/plan");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Gradient Header */}
      <LinearGradient colors={["#6BCB77", "#4AAE63"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="school-outline" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Prepare for Exam</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={subjects}
        keyExtractor={(s) => s._id || s.id || s.name}
        ListHeaderComponent={
          <View>
            {/* Schedule Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconCircle, { backgroundColor: "#e3f2fd" }]}>
                  <Ionicons name="time-outline" size={20} color="#1976d2" />
                </View>
                <Text style={styles.cardTitle}>Study Schedule</Text>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Start Time</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="sunny-outline" size={16} color="#77C272" />
                    <TextInput
                      placeholder="09:00"
                      value={dailyStartTime}
                      onChangeText={setDailyStartTime}
                      style={styles.fieldInput}
                      placeholderTextColor="#bbb"
                    />
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>End Time</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="moon-outline" size={16} color="#77C272" />
                    <TextInput
                      placeholder="17:00"
                      value={dailyEndTime}
                      onChangeText={setDailyEndTime}
                      style={styles.fieldInput}
                      placeholderTextColor="#bbb"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Days</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="calendar-outline" size={16} color="#77C272" />
                    <TextInput
                      placeholder="30"
                      value={numDays}
                      onChangeText={(text) => setNumDays(text.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      style={styles.fieldInput}
                      placeholderTextColor="#bbb"
                    />
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="today-outline" size={16} color="#77C272" />
                    <TextInput
                      placeholder="2026-01-01"
                      value={startDate}
                      onChangeText={setStartDate}
                      style={styles.fieldInput}
                      placeholderTextColor="#bbb"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Datesheet Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconCircle, { backgroundColor: "#fff3e0" }]}>
                  <Ionicons name="document-text-outline" size={20} color="#ef6c00" />
                </View>
                <Text style={styles.cardTitle}>Exam Datesheet</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadFile("/api/planner/datesheet")}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>Upload Date Sheet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => openGeneralViewer("/api/planner/datesheet", "Date Sheets")}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color="#388e3c" />
                <Text style={styles.outlineBtnText}>View Date Sheets</Text>
              </TouchableOpacity>
            </View>

            {/* Subjects Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconCircle, { backgroundColor: "#f3e5f5" }]}>
                  <Ionicons name="library-outline" size={20} color="#7b1fa2" />
                </View>
                <Text style={styles.cardTitle}>Subjects</Text>
              </View>
              <View style={styles.addSubjectRow}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Ionicons name="add-circle-outline" size={16} color="#77C272" />
                  <TextInput
                    placeholder="Add a subject..."
                    value={newSubject}
                    onChangeText={setNewSubject}
                    style={styles.fieldInput}
                    placeholderTextColor="#bbb"
                  />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={addSubject} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Materials Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconCircle, { backgroundColor: "#e8f5e9" }]}>
                  <Ionicons name="folder-open-outline" size={20} color="#388e3c" />
                </View>
                <Text style={styles.cardTitle}>Study Materials</Text>
              </View>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadFile("/api/planner/materials")}
                activeOpacity={0.8}
              >
                <Ionicons name="document-attach-outline" size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>Upload Notes/Materials</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => openGeneralViewer("/api/planner/materials", "Materials")}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color="#388e3c" />
                <Text style={styles.outlineBtnText}>View Materials</Text>
              </TouchableOpacity>
            </View>

            {/* Create Plan Button */}
            <TouchableOpacity
              style={[styles.createPlanBtn, { opacity: loading ? 0.7 : 1 }]}
              onPress={createPlan}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#6BCB77", "#4AAE63"]}
                style={styles.createPlanGradient}
              >
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <Text style={styles.createPlanText}>
                  {loading ? "Creating Plan..." : "Create Study Plan"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {subjects.length > 0 && (
              <Text style={styles.subjectListLabel}>Your Subjects</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const sid = (item._id || item.id || "") as string;
          const count = notesCount[sid] || 0;
          return (
            <View style={styles.subjectItem}>
              <View style={styles.subjectIcon}>
                <Ionicons name="book" size={18} color="#388e3c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subjectName}>{item.name}</Text>
                <Text style={styles.subjectFiles}>{count} file{count !== 1 ? "s" : ""}</Text>
              </View>
              <TouchableOpacity
                style={styles.chipBtn}
                onPress={() => openSubjectViewer(sid, item.name)}
                activeOpacity={0.7}
              >
                <Ionicons name="eye-outline" size={14} color="#388e3c" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chipBtn}
                onPress={() =>
                  uploadFile(
                    `/api/planner/notes?subjectId=${encodeURIComponent(sid)}`,
                    { subjectId: sid }
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#388e3c" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chipBtn, { backgroundColor: "#ffebee" }]}
                onPress={() => deleteSubject(sid)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#e53935" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* File Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{viewerTitle}</Text>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close-circle" size={26} color="#999" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {viewerItems.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <Ionicons name="document-outline" size={36} color="#ccc" />
                  <Text style={styles.modalEmptyText}>No files yet</Text>
                </View>
              ) : (
                viewerItems.map((f, idx) => (
                  <TouchableOpacity key={idx} style={styles.fileRow} onPress={() => openUrl(f.url)} activeOpacity={0.7}>
                    <TouchableOpacity
                      onPress={() => toggleSelect(f._id || f.name || f.url)}
                      style={styles.checkbox}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          selected.has(f._id || f.name || f.url) && styles.checkboxChecked,
                        ]}
                      >
                        {selected.has(f._id || f.name || f.url) && (
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <Ionicons name="document-text" size={18} color="#388e3c" />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {f.originalName}
                    </Text>
                    <Ionicons name="open-outline" size={16} color="#999" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {viewerItems.length > 0 && (
              <TouchableOpacity
                style={styles.deleteSelectedBtn}
                onPress={deleteSelected}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.deleteSelectedText}>Delete Selected</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  optionalBadge: {
    fontSize: 11,
    color: "#999",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    fontWeight: "500",
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 8,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  addSubjectRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  addBtn: {
    backgroundColor: "#77C272",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#77C272",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  outlineBtnText: {
    color: "#388e3c",
    fontWeight: "600",
    fontSize: 13,
  },
  createPlanBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#388e3c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  createPlanGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  createPlanText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
  subjectListLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  subjectFiles: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  chipBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: "800",
    color: "#333",
    fontSize: 18,
  },
  modalEmptyWrap: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  modalEmptyText: {
    color: "#999",
    fontSize: 14,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  fileName: {
    flex: 1,
    color: "#333",
    fontSize: 14,
  },
  checkbox: { padding: 4 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#77C272",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#77C272",
  },
  deleteSelectedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  deleteSelectedText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

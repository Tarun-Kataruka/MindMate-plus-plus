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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

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
          `${baseUrl}/api/planner/notes?subjectId=${encodeURIComponent(
            subjectId
          )}`,
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
      // load notes count for each subject
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
    if (!subjectId) {
      console.log("deleteSubject: No subjectId provided");
      return;
    }
    try {
      const res = await fetch(
        `${baseUrl}/api/planner/deletesubject/${encodeURIComponent(subjectId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || "Failed to delete subject");
      }

      console.log("Delete successful:", result);
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
        `${baseUrl}/api/planner/notes?subjectId=${encodeURIComponent(
          subjectId
        )}`,
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
      setViewerKind(
        endpoint.includes("datesheet") ? "datesheets" : "materials"
      );
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
        // refresh
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
      // Reload current modal list
      if (viewerKind === "subject") {
        // We don't have subject id easily from title; fallback: close and refresh counts
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
        // On web, expo-document-picker provides a File object as asset.file
        if (asset.file instanceof File) {
          form.append("files", asset.file as File, name);
        } else {
          // Native (iOS/Android) path
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
      const today = new Date().toISOString();
      const res = await fetch(`${baseUrl}/api/planner/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ startFrom: today }),
      });
      if (!res.ok) throw new Error("Failed to plan");
      Alert.alert("Plan Created", "Study plan generated from today.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#388e3c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prepare for Exam</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={subjects}
        keyExtractor={(s) => s._id || s.id || s.name}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.row}>
              <TextInput
                placeholder="Add subject"
                value={newSubject}
                onChangeText={setNewSubject}
                style={styles.input}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Upload Date Sheet
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => uploadFile("/api/planner/datesheet")}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.actionText}>Upload Date Sheet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, { marginTop: 8 }]}
              onPress={() =>
                openGeneralViewer("/api/planner/datesheet", "Date Sheets")
              }
            >
              <Text style={styles.viewBtnText}>View Date Sheets</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Upload Materials
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => uploadFile("/api/planner/materials")}
            >
              <Ionicons name="document-attach" size={20} color="#fff" />
              <Text style={styles.actionText}>Upload Notes/Materials</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, { marginTop: 8 }]}
              onPress={() =>
                openGeneralViewer("/api/planner/materials", "Materials")
              }
            >
              <Text style={styles.viewBtnText}>View Materials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { marginTop: 28, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={createPlan}
              disabled={loading}
            >
              <Text style={styles.primaryText}>
                {loading ? "Planning…" : "Plan from Today"}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.subjectItem}>
            <Ionicons name="folder" size={18} color="#388e3c" />
            <Text style={styles.subjectText}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => openSubjectViewer(item._id || item.id, item.name)}
            >
              <Text style={styles.countText}>
                {notesCount[item._id || item.id || ""] || 0} files
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() =>
                uploadFile(
                  `/api/planner/notes?subjectId=${encodeURIComponent(
                    (item._id || item.id || "") as string
                  )}`,
                  { subjectId: (item._id || item.id || "") as string }
                )
              }
            >
              <Text style={styles.smallBtnText}>Add File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteSubjectBtn}
              onPress={() => {
                deleteSubject(item._id || item.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        )}
      />

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
              <TouchableOpacity
                onPress={() => setViewerVisible(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={24} color="#388e3c" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {viewerItems.length === 0 ? (
                <Text style={{ color: "#666" }}>No files yet.</Text>
              ) : (
                viewerItems.map((f, idx) => (
                  <View key={idx} style={styles.fileRow}>
                    <TouchableOpacity
                      onPress={() => toggleSelect(f._id || f.name || f.url)}
                      style={styles.checkbox}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          selected.has(f._id || f.name || f.url) &&
                            styles.checkboxChecked,
                        ]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onPress={() => openUrl(f.url)}
                    >
                      <Ionicons
                        name="document-text"
                        size={18}
                        color="#388e3c"
                      />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {f.originalName}
                      </Text>
                      <Ionicons name="open" size={18} color="#388e3c" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            {viewerItems.length > 0 ? (
              <TouchableOpacity
                style={[styles.deleteBtn, { marginTop: 12 }]}
                onPress={deleteSelected}
              >
                <Text style={styles.deleteBtnText}>Delete Selected</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  backButton: { padding: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "#388e3c",
    fontSize: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addBtn: {
    backgroundColor: "#77C272",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "600" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#77C272",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#77C272",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  subjectText: { flex: 1, color: Colors.light.text },
  countText: { color: "#388e3c", marginRight: 8 },
  smallBtn: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: { color: "#388e3c", fontWeight: "600" },
  deleteSubjectBtn: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  viewBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtnText: { color: "#388e3c", fontWeight: "600" },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontWeight: "700", color: "#388e3c", fontSize: 16 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fileName: { flex: 1, color: Colors.light.text },
  checkbox: { padding: 4 },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#77C272",
  },
  checkboxChecked: { backgroundColor: "#77C272" },
  deleteBtn: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: { color: "#fff", fontWeight: "700" },
});

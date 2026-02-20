import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import BlogCard from "./BlogCard";

interface BlogItem {
  _id?: string;
  id?: string;
  author: string;
  title: string;
  image: string;
  excerpt: string;
  likes?: number;
}

interface BlogTabProps {
  data: BlogItem[];
  onCreated?: (created: any) => void;
  onLiked?: (updated: any) => void;
}

const BlogTab: React.FC<BlogTabProps> = ({ data, onCreated, onLiked }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{
    author: string;
    title: string;
    image: string;
    excerpt: string;
  }>({ author: "", title: "", image: "", excerpt: "" });

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("likedBlogIds");
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          setLikedIds(new Set(arr));
        }
      } catch {}
    })();
  }, []);

  const onSubmitCreate = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: form.author,
          title: form.title,
          excerpt: form.excerpt,
          image: form.image,
        }),
      });

      if (!res.ok) throw new Error("Failed to create blog");
      const created = await res.json();
      onCreated && onCreated(created);

      setShowCreate(false);
      setForm({ author: "", title: "", image: "", excerpt: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const onLike = async (id?: string) => {
    if (!id) return;
    if (likedIds.has(id)) return;
    try {
      const res = await fetch(`${baseUrl}/api/blogs/${id}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to like");
      const updated = await res.json();
      onLiked && onLiked(updated);
      const next = new Set(likedIds);
      next.add(id);
      setLikedIds(next);
      try {
        await AsyncStorage.setItem(
          "likedBlogIds",
          JSON.stringify(Array.from(next))
        );
      } catch {}
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => (item._id || item.id) as string}
        renderItem={({ item }) => (
          <BlogCard
            {...item}
            baseUrl={baseUrl}
            onPress={() =>
              router.push({
                pathname: "/blog/[id]",
                params: { id: (item._id || item.id) as string },
              })
            }
            onPressLike={() => onLike(item._id || item.id)}
            liked={likedIds.has((item._id || item.id) as string)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCircle}>
              <Ionicons name="newspaper-outline" size={40} color="#c8e6c9" />
            </View>
            <Text style={styles.emptyTitle}>No blogs yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share a story!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCreate(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Ionicons name="create-outline" size={22} color="#388e3c" />
              <Text style={styles.modalTitle}>New Blog Post</Text>
            </View>
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={form.author}
              onChangeText={(v) => setForm((f) => ({ ...f, author: v }))}
            />
            <TextInput
              placeholder="Blog title"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <TextInput
              placeholder="Cover image URL (https://...)"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={form.image}
              onChangeText={(v) => setForm((f) => ({ ...f, image: v }))}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.imagePreview} />
            ) : null}
            <TextInput
              placeholder="Write a short excerpt..."
              placeholderTextColor="#aaa"
              style={[styles.input, styles.textArea]}
              multiline
              value={form.excerpt}
              onChangeText={(v) => setForm((f) => ({ ...f, excerpt: v }))}
            />
            <TouchableOpacity onPress={onSubmitCreate} style={styles.submitBtn} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>Publish</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default BlogTab;

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f8e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#555",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#77C272",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#388e3c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  imagePreview: {
    width: "100%",
    height: 140,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
  },
  submitBtn: {
    backgroundColor: "#388e3c",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

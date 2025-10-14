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
import { Colors } from "@/constants/theme";

interface BlogItem {
  _id?: string;
  id?: string;
  author: string;
  title: string;
  image: string;
  excerpt: string;
}

interface BlogTabProps {
  data: BlogItem[];
  onCreated?: (created: any) => void;
}

const BlogCard: React.FC<BlogItem> = ({ title, author, image, excerpt }) => (
  <View style={styles.blogCard}>
    <Image source={{ uri: image }} style={styles.blogImage} />
    <View style={styles.blogInfo}>
      <Image
        source={{ uri: "https://placehold.co/40x40/52528C/FFFFFF/png?text=M" }}
        style={styles.blogAvatar}
      />
      <Text style={styles.blogAuthor}>{author}</Text>
    </View>
    <Text style={styles.blogTitle}>{title}</Text>
    <Text style={styles.blogExcerpt}>{excerpt}</Text>
  </View>
);

const BlogTab: React.FC<BlogTabProps> = ({ data, onCreated }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{
    author: string;
    title: string;
    image: string;
    excerpt: string;
  }>({ author: "", title: "", image: "", excerpt: "" });
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  const onSubmitCreate = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => (item._id || item.id) as string}
        renderItem={({ item }) => <BlogCard {...item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
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
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              New Blog
            </Text>
            <TextInput
              placeholder="Author"
              style={styles.input}
              value={form.author}
              onChangeText={(v) => setForm((f) => ({ ...f, author: v }))}
            />
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            />
            <TextInput
              placeholder="Image URL (optional)"
              style={styles.input}
              value={form.image}
              onChangeText={(v) => setForm((f) => ({ ...f, image: v }))}
            />
            <TextInput
              placeholder="Excerpt"
              style={[styles.input, { height: 90 }]}
              multiline
              value={form.excerpt}
              onChangeText={(v) => setForm((f) => ({ ...f, excerpt: v }))}
            />
            <TouchableOpacity onPress={onSubmitCreate} style={styles.submitBtn}>
              <Text style={styles.submitText}>Save</Text>
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
    padding: 15,
    paddingBottom: 30,
  },
  blogCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  blogImage: {
    width: "100%",
    height: 180,
  },
  blogInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  blogAvatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
  },
  blogAuthor: {
    fontSize: 15,
    fontWeight: "600",
  },
  blogTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 10,
  },
  blogExcerpt: {
    fontSize: 14,
    color: "#555",
    padding: 10,
    paddingTop: 5,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: Colors.blogFabBg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: Colors.blogFabText,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#388e3c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
  },
});

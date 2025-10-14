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
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/theme";
import { AntDesign } from "@expo/vector-icons";

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

// --- BlogCard matching screenshot ---
const BlogCard: React.FC<BlogItem> = ({ title, author, image }) => (
  <View style={styles.blogCardRow}>
    {image ? (
      <Image source={{ uri: image }} style={styles.cardImage} />
    ) : (
      <View style={[styles.cardImage, { backgroundColor: "#ececec" }]} />
    )}

    <View style={styles.cardTextContainer}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.cardAuthor}>{author}</Text>
      <View style={styles.cardLikesRow}>
        <AntDesign name="like" size={17} color="#868686" />
        <Text style={styles.cardLikesText}>421 Likes</Text>
      </View>
    </View>
  </View>
);

const BlogTab: React.FC<BlogTabProps> = ({ data, onCreated }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{
    author: string;
    title: string;
    excerpt: string;
  }>({ author: "", title: "", excerpt: "" });

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    // Expo SDK 49+
    if (!result.canceled) {
      if (result.assets && result.assets.length > 0) {
        setPickedImage(result.assets[0].uri);
      }
    }
  };

  const onSubmitCreate = async () => {
    try {
      const formData = new FormData();
      formData.append("author", form.author);
      formData.append("title", form.title);
      formData.append("excerpt", form.excerpt);
      if (pickedImage) {
        formData.append("image", {
          uri: pickedImage,
          name: "photo.jpg",
          type: "image/jpg",
        } as any);
      }

      const res = await fetch(`${baseUrl}/api/blogs`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create blog");
      const created = await res.json();
      onCreated && onCreated(created);

      setShowCreate(false);
      setForm({ author: "", title: "", excerpt: "" });
      setPickedImage(null);
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
            {/* Image picker button */}
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              <Text style={styles.imagePickerText}>
                {pickedImage ? "Change Image" : "Pick an Image"}
              </Text>
            </TouchableOpacity>
            {/* Preview picked image */}
            {pickedImage ? (
              <Image
                source={{ uri: pickedImage }}
                style={styles.imagePreview}
              />
            ) : null}
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
  // --- BlogCard styles matching screenshot ---
  blogCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 17,
    marginBottom: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 16,
    backgroundColor: "#ececec",
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    color: "#232323",
  },
  cardAuthor: {
    fontSize: 13,
    color: "#B0B0B0",
    marginBottom: 5,
  },
  cardLikesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLikesText: {
    fontSize: 13,
    color: "#868686",
    marginLeft: 7,
  },
  // --- FAB and modal styles ---
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#77C272",
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
  imagePickerBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#2e7d32",
    marginBottom: 10,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  imagePreview: {
    width: "100%",
    height: 150,
    marginBottom: 10,
    borderRadius: 10,
  },
});

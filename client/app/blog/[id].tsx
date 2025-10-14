import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Colors } from "@/constants/theme";

type Blog = {
  _id?: string;
  id?: string;
  author: string;
  title: string;
  image: string;
  excerpt: string;
  likes?: number;
};

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/blogs/${id}`);
        const data = await res.json();
        setBlog(data);
      } catch (e) {
        console.error("Failed to load blog", e);
      }
    };
    if (id) fetchBlog();
  }, [id, baseUrl]);

  useEffect(() => {
    if (blog?.title) {
      try {
        navigation.setOptions({
          title: blog.title,
          headerStyle: { backgroundColor: "#77C272" },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff" },
        });
      } catch {}
    }
  }, [blog, navigation]);

  if (!blog)
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.background }} />
    );

  const resolvedImage = blog.image
    ? blog.image.startsWith("http://") || blog.image.startsWith("https://")
      ? blog.image
      : `${baseUrl}${blog.image}`
    : "";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {resolvedImage ? (
          <Image source={{ uri: resolvedImage }} style={styles.image} />
        ) : null}
        <Text style={styles.title}>{blog.title}</Text>
        {blog.author ? (
          <Text style={styles.author}>by {blog.author}</Text>
        ) : null}
        <Text style={styles.excerpt}>{blog.excerpt}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    padding: 4,
    paddingBottom: 30,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#ececec',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    color: '#232323',
  },
  author: {
    fontSize: 13,
    color: '#8A8A8A',
    marginBottom: 16,
  },
  excerpt: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  }
});


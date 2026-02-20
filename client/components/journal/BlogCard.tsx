import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface BlogCardProps {
  _id?: string;
  id?: string;
  author: string;
  title: string;
  image: string;
  excerpt: string;
  likes?: number;
  baseUrl?: string;
  liked?: boolean;
  onPress?: () => void;
  onPressLike?: () => void;
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  author,
  image,
  excerpt,
  baseUrl,
  likes,
  liked,
  onPress,
  onPressLike,
}) => {
  const resolvedImage =
    image &&
    (image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("/"))
      ? { uri: image }
      : image
      ? { uri: `${baseUrl ?? ""}${image}` }
      : require("../../assets/default.png");

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Image source={resolvedImage} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.authorRow}>
          <View style={styles.authorDot} />
          <Text style={styles.cardAuthor} numberOfLines={1}>{author}</Text>
        </View>
        {excerpt ? (
          <Text style={styles.cardExcerpt} numberOfLines={2}>{excerpt}</Text>
        ) : null}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            onPress={onPressLike}
            activeOpacity={0.7}
            style={[styles.likeBtn, liked && styles.likeBtnActive]}
            disabled={liked}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={18}
              color={liked ? "#e53935" : "#888"}
            />
            <Text style={[styles.likeText, liked && { color: "#e53935" }]}>
              {typeof likes === "number" ? likes : 0}
            </Text>
          </TouchableOpacity>
          <View style={styles.readMoreRow}>
            <Text style={styles.readMoreText}>Read</Text>
            <Ionicons name="arrow-forward" size={14} color="#77C272" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default BlogCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#e8f5e9",
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  authorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#77C272",
  },
  cardAuthor: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  cardExcerpt: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  likeBtnActive: {
    backgroundColor: "#ffebee",
  },
  likeText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  readMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#77C272",
  },
});

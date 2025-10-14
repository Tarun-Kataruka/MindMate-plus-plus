import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

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

const BlogCard: React.FC<BlogCardProps> = ({ title, author, image, baseUrl, likes, liked, onPress, onPressLike }) => {
  const resolvedImage = image
    ? (image.startsWith('http://') || image.startsWith('https://')
        ? image
        : `${baseUrl ?? ''}${image}`)
    : '';

  return (
    <TouchableOpacity style={styles.blogCardRow} activeOpacity={0.8} onPress={onPress}>
      {resolvedImage ? (
        <Image source={{ uri: resolvedImage }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, { backgroundColor: "#ececec" }]} />
      )}

      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.cardAuthor}>{author}</Text>
        <View style={styles.cardLikesRow}>
          <TouchableOpacity onPress={onPressLike} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }} disabled={liked}>
            {liked ? (
              <FontAwesome name="thumbs-up" size={18} color="#2e7d32" />
            ) : (
              <FontAwesome name="thumbs-o-up" size={18} color="#6b6b6b" />
            )}
            <Text style={styles.cardLikesText}>{typeof likes === 'number' ? likes : 0} Likes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default BlogCard;

const styles = StyleSheet.create({
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
});



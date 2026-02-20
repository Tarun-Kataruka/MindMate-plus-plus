import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TRACKS = [
  {
    key: "favorites",
    label: "Favorites",
    image: require("../assets/giphy.gif"),
    icon: "heart" as const,
    color: "#e53935",
  },
  {
    key: "yoga-meditation",
    label: "Yoga & Meditation",
    image: require("../assets/Meditation.jpeg"),
    icon: "leaf" as const,
    color: "#43a047",
  },
  {
    key: "mind-body",
    label: "Mind & Body",
    image: require("../assets/body.jpeg"),
    icon: "body" as const,
    color: "#7b1fa2",
  },
  {
    key: "asmr-sounds",
    label: "ASMR Sounds",
    image: require("../assets/asmr.jpeg"),
    icon: "headset" as const,
    color: "#1976d2",
  },
  {
    key: "breathing-exercises",
    label: "Breathing",
    image: require("../assets/breathing.jpeg"),
    icon: "cloud" as const,
    color: "#00897b",
  },
  {
    key: "focus-productivity",
    label: "Focus Music",
    image: require("../assets/focus.jpeg"),
    icon: "musical-notes" as const,
    color: "#ef6c00",
  },
  {
    key: "affirmations-positivity",
    label: "Affirmations",
    image: require("../assets/affirmation.jpeg"),
    icon: "sunny" as const,
    color: "#fdd835",
  },
];

export default function TracksSection() {
  const router = useRouter();

  const handleTrackPress = (trackType: string) => {
    router.push(`/tracks/${trackType}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="musical-notes" size={18} color="#7b1fa2" />
        <Text style={styles.sectionTitle}>Tracks to Refresh Your Mood</Text>
      </View>

      {/* Featured track - full width */}
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handleTrackPress("favorites")}
        activeOpacity={0.85}
      >
        <Image source={TRACKS[0].image} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}>
            <Ionicons name="heart" size={14} color="#fff" />
          </View>
          <Text style={styles.featuredTitle}>Your Favorites</Text>
          <Text style={styles.featuredSub}>Your saved tracks</Text>
        </View>
      </TouchableOpacity>

      {/* Scrollable track cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRACKS.slice(1).map((track) => (
          <TouchableOpacity
            key={track.key}
            style={styles.trackCard}
            onPress={() => handleTrackPress(track.key)}
            activeOpacity={0.8}
          >
            <Image source={track.image} style={styles.trackImage} />
            <View style={styles.trackInfo}>
              <View
                style={[
                  styles.trackIconBg,
                  { backgroundColor: track.color + "18" },
                ]}
              >
                <Ionicons
                  name={track.icon}
                  size={14}
                  color={track.color}
                />
              </View>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  /* Featured card */
  featuredCard: {
    marginHorizontal: 18,
    borderRadius: 20,
    overflow: "hidden",
    height: 140,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 18,
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "#e53935",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  featuredSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },

  /* Horizontal track cards */
  scrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  trackCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  trackImage: {
    width: 140,
    height: 90,
    resizeMode: "cover",
  },
  trackInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  trackIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  trackTitle: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
});

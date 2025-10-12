import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function TracksSection() {
  return (
    <View style={styles.tracksBlock}>
      <Text style={styles.tracksLabel}>TRACKS TO REFRESH YOUR MOOD!</Text>
      <View style={styles.tracksRow}>
        <View style={styles.trackCard}>
          <Image
            source={require("../assets/Meditation.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Yoga & Meditation</Text>
        </View>
        <View style={styles.trackCard}>
          <Image
            source={require("../assets/body.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Mind & Body</Text>
        </View>
      </View>
      <View style={styles.tracksRow}>
        <View style={styles.trackCard}>
          <Image
           source={require("../assets/asmr.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>ASMR Sounds</Text>
        </View>
        <View style={styles.trackCard}>
          <Image
           source={require("../assets/breathing.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Breathing Exercises</Text>
        </View>
      </View>
      <View style={styles.tracksRow}>
        <View style={styles.trackCard}>
          <Image
            source={require("../assets/focus.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Focus & Productivity Music</Text>
        </View>
        <View style={styles.trackCard}>
          <Image
            source={require("../assets/affirmation.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Affirmations & Positivity</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tracksBlock: {
    alignSelf: "stretch",
    marginHorizontal: 14,
    marginVertical: 8,
  },
  tracksLabel: {
    fontSize: 16,
    color: "#222",
    fontWeight: "700",
    marginBottom: 14,
    marginLeft: 4,
  },
  tracksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  trackCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    overflow: "hidden",
    width: 155,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#77C272",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginBottom: 4,
  },
  trackImage: {
    width: 155,
    height: 75,
    resizeMode: "cover",
  },
  trackTitle: {
    fontSize: 14,
    color: "#388e3c",
    fontWeight: "600",
    padding: 10,
    textAlign: "center",
    lineHeight: 18,
  },
});



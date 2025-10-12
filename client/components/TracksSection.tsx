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
  },
  trackCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    overflow: "hidden",
    width: 155,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#77C272",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  trackImage: {
    width: 155,
    height: 75,
    resizeMode: "cover",
  },
  trackTitle: {
    fontSize: 15,
    color: "#388e3c",
    fontWeight: "bold",
    padding: 8,
    textAlign: "center",
  },
});



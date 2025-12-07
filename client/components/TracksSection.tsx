import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TracksSection() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleTrackPress = (trackType: string) => {
    switch (trackType) {
      case 'favorites':
        router.push('/tracks/favorites' as any);
        break;
      case 'yoga-meditation':
        router.push('/tracks/yoga-meditation' as any);
        break;
      case 'mind-body':
        router.push('/tracks/mind-body' as any);
        break;
      case 'asmr-sounds':
        router.push('/tracks/asmr-sounds' as any);
        break;
      case 'breathing-exercises':
        router.push('/tracks/breathing-exercises' as any);
        break;
      case 'focus-productivity':
        router.push('/tracks/focus-productivity' as any);
        break;
      case 'affirmations-positivity':
        router.push('/tracks/affirmations-positivity' as any);
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.tracksBlock}>
      <Text style={styles.tracksLabel}>TRACKS TO REFRESH YOUR MOOD!</Text>
      <View style={styles.tracksRow}>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('favorites')}
        >
          <Image
            source={require("../assets/giphy.gif")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.trackCard, { opacity: 0 }]} disabled>
          <Image source={require('../assets/default.png')} style={styles.trackImage} />
          <Text style={styles.trackTitle}> </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tracksRow}>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('yoga-meditation')}
        >
          <Image
            source={require("../assets/Meditation.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Yoga & Meditation</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('mind-body')}
        >
          <Image
            source={require("../assets/body.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Mind & Body</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tracksRow}>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('asmr-sounds')}
        >
          <Image
           source={require("../assets/asmr.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>ASMR Sounds</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('breathing-exercises')}
        >
          <Image
           source={require("../assets/breathing.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Breathing Exercises</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tracksRow}>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('focus-productivity')}
        >
          <Image
            source={require("../assets/focus.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Focus & Productivity Music</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.trackCard} 
          onPress={() => handleTrackPress('affirmations-positivity')}
        >
          <Image
            source={require("../assets/affirmation.jpeg")}
            style={styles.trackImage}
          />
          <Text style={styles.trackTitle}>Affirmations & Positivity</Text>
        </TouchableOpacity>
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



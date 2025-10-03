import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import QuoteOfTheDay from "./components/QuoteOfTheDay";
import { useFocusEffect } from "@react-navigation/native";

const AVATAR_URL =
  "https://img.icons8.com/ios-filled/100/000000/user-male-circle.png";
const BOT_URL =
  "https://img.icons8.com/external-flatart-icons-outline-flatarticons/64/000000/external-chat-bot-artificial-intelligence-flatart-icons-outline-flatarticons-1.png";

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string>("");

  const fetchMe = useCallback(async () => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      if (!token) return;
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.user?.name) {
        const name = String(data.user.name);
        setFirstName(name.split(" ")[0]);
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMe();
    }, [fetchMe])
  );

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Green Rounded Header */}
      <View style={styles.headerBg}>
        <Text style={styles.greeting}>Hello !</Text>
        <Text style={styles.name}>{firstName || "Friend"}</Text>
        <Image source={{ uri: AVATAR_URL }} style={styles.avatar} />
      </View>

      <View style={styles.botSection}>
        <Image source={{ uri: BOT_URL }} style={styles.botImage} />
        <View style={styles.botTextBlock}>
          <Text style={styles.botLabel}>IM TINK</Text>
          <TouchableOpacity style={styles.talkBtn}>
            <Text style={styles.talkBtnText}>LETS TALK</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quote of the Day */}
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteLabel}>QUOTE OF THE DAY</Text>
        <View style={styles.quoteBg}>
          <QuoteOfTheDay apiBaseUrl={process.env.EXPO_PUBLIC_API_URL} />
        </View>
      </View>

      {/* Tracks Section */}
      <View style={styles.tracksBlock}>
        <Text style={styles.tracksLabel}>TRACKS TO REFRESH YOUR MOOD!</Text>
        <View style={styles.tracksRow}>
          <View style={styles.trackCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
              }}
              style={styles.trackImage}
            />
            <Text style={styles.trackTitle}>Yoga & Meditation</Text>
          </View>
          <View style={styles.trackCard}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
              }}
              style={styles.trackImage}
            />
            <Text style={styles.trackTitle}>Mind & Body</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff", // pure white background
  },
  contentContainer: {
    padding: 0,
    alignItems: "center",
  },
  headerBg: {
    backgroundColor: "#77C272",
    width: "100%",
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    position: "relative",
  },
  greeting: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "400",
    marginBottom: 2,
  },
  name: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#f5f5f5",
    position: "absolute",
    top: 18,
    right: 32,
  },
  botSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "stretch",
    padding: 18,
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#77C272",
    shadowOpacity: 0.35,
    shadowRadius: 7,
    borderColor: "#77C272",
    borderWidth: 2,
  },
  botImage: {
    width: 78,
    height: 78,
    marginRight: 18,
  },
  botTextBlock: {
    flex: 1,
    justifyContent: "center",
  },
  botLabel: {
    fontSize: 17,
    color: "#388e3c",
    fontWeight: "bold",
    marginBottom: 6,
  },
  talkBtn: {
    backgroundColor: "#252525",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 2,
  },
  talkBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  quoteBlock: {
    alignSelf: "stretch",
    marginBottom: 20,
    marginHorizontal: 24,
  },
  quoteLabel: {
    fontSize: 16,
    color: "#222",
    fontWeight: "700",
    marginBottom: 4,
    marginLeft: 2,
  },
  quoteBg: {
    backgroundColor: "#ffeb3b",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 4,
  },
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

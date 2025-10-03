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
import { router } from "expo-router";
import TracksSection from "./components/TracksSection";
import { useFocusEffect } from "@react-navigation/native";

const AVATAR_URL =
  "https://img.icons8.com/ios-filled/100/000000/user-male-circle.png";
// Local bot GIF asset
const BOT_GIF = require("../../assets/tink.gif");

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
        <Image source={BOT_GIF} style={styles.botImage} />
        <View style={styles.botTextBlock}>
          <Text style={styles.botLabel}>I&apos;M Mate</Text>
          <TouchableOpacity style={styles.talkBtn} onPress={() => router.push('/(tabs)/chat')}>
            <Text style={styles.talkBtnText}>LET&apos;S TALK</Text>
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

      <TracksSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
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
});

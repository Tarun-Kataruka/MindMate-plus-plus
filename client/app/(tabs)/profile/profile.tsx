import React, { useState, createContext, useContext, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

const Colors = {
  primary: "#77C272",
  secondary: "#388e3c",
  tint: "#252525",
  white: "#fff",
  black: "#000",
  lightGrey: "#e0e0e0",
  yellow: "#FFC107",
};

export interface UserData {
  name: string;
  gender: string;
  age: number;
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  concerns: string[];
  avatarUrl?: string;
}

interface UserContextType {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const initialUserData: UserData = {
  name: "Shreya",
  gender: "female",
  age: 19,
  email: "shreyaguptaapril@gmail.com",
  phone: "9876543210",
  emergencyContactName: "Mom",
  emergencyContactPhone: "9999999999",
  concerns: [
    "Anger",
    "Anxiety and Panic Attacks",
    "Depression",
    "Sleep disorders",
  ],
  avatarUrl: undefined,
};

export const UserContext = createContext<UserContextType>({
  userData: initialUserData,
  setUserData: () => {},
});

export const useUser = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData>(initialUserData);
  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

const Chip = ({
  text,
  userConcerns,
}: {
  text: string;
  userConcerns: string[];
}) => {
  const isSelected = userConcerns.includes(text);
  return (
    <View
      style={[
        chipStyles.chip,
        isSelected ? chipStyles.selectedChip : chipStyles.defaultChip,
      ]}
    >
      <Ionicons
        name={isSelected ? "checkmark-sharp" : "close-circle-outline"}
        size={14}
        color={isSelected ? Colors.white : "#8aa486"}
        style={{ marginRight: 6 }}
      />
      <Text
        style={isSelected ? chipStyles.selectedText : chipStyles.defaultText}
      >
        {text}
      </Text>
    </View>
  );
};

export function ProfileScreenContent() {
  const { t } = useTranslation();
  const { userData, setUserData } = useUser();
  const API_BASE = ((process.env.EXPO_PUBLIC_API_URL as string) || "").replace(
    /\/?$/,
    "/"
  );

  const fetchProfile = useCallback(async () => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      if (!token) return;
      const res = await fetch(`${API_BASE}api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.user) {
        // Set language preference
        if (data.user.language) {
          i18n.changeLanguage(data.user.language);
        }
        setUserData({
          name: data.user.name || "",
          gender: data.user.gender || "other",
          age: data.user.age || 0,
          email: data.user.email || "",
          phone: data.user.phone || "",
          emergencyContactName: data.user.emergencyContactName || "",
          emergencyContactPhone: data.user.emergencyContactPhone || "",
          concerns: Array.isArray(data.user.concerns) ? data.user.concerns : [],
          // @ts-ignore
          avatarUrl: data.user.avatarUrl || undefined,
        });
      }
    } catch {}
  }, [setUserData, API_BASE]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const allConcerns = [
    "Anger",
    "Anxiety and Panic Attacks",
    "Depression",
    "Eating disorders",
    "Self-esteem",
    "Self-harm",
    "Stress",
    "Sleep disorders",
  ];

  const concernKeyMap: { [key: string]: string } = {
    "Anger": "anger",
    "Anxiety and Panic Attacks": "anxiety",
    "Depression": "depression",
    "Eating disorders": "eatingDisorder",
    "Self-esteem": "selfEsteem",
    "Self-harm": "selfHarm",
    "Stress": "stress",
    "Sleep disorders": "sleepDisorder",
  };

  const terms = [
    "By using MindMate++, you agree to these Terms and our Privacy Policy.",
    "The app provides AI-powered study and wellbeing support. It does not replace professional academic, medical, or mental health advice.",
    "AI study plans are for guidance only; outcomes depend on your effort, consistency, and individual factors.",
    "You are responsible for the accuracy of information (subjects, notes, timetable) you upload.",
    "We are not liable for any results, losses, or issues arising from the use or inability to use the app.",
    "If you face serious stress or mental health concerns, seek help from a qualified counselor or healthcare provider.",
    "We may update our Terms periodically. Continued use of the app means you accept those changes.",
    "For questions, contact us at support@mindmate.example.",
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t("profile.title")}</Text>
        <TouchableOpacity onPress={() => router.push("./edit")}>
          <Ionicons name="create-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatarWrapper}>
          {userData.avatarUrl ? (
            <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
          ) : (
            <Image
              source={{
                uri:
                  userData.gender === "male"
                    ? "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
                    : "https://cdn-icons-png.flaticon.com/512/4140/4140047.png",
              }}
              style={styles.avatar}
            />
          )}
        </View>
        <Text style={styles.name}>{userData.name}</Text>

        <View style={styles.infoRowCenter}>
          <Ionicons
            name="transgender-outline"
            size={16}
            color={Colors.secondary}
          />
          <Text style={styles.infoText}>
            {userData.gender === "male" ? t("profile.male") :
             userData.gender === "female" ? t("profile.female") :
             t("profile.other")}
          </Text>
        </View>
        <View style={styles.infoRowCenter}>
          <Ionicons
            name="hourglass-outline"
            size={16}
            color={Colors.secondary}
          />
          <Text style={styles.infoText}>{userData.age} {t("profile.age")}</Text>
        </View>
        <View style={styles.infoRowCenter}>
          <Ionicons name="call-outline" size={16} color={Colors.secondary} />
          {!!userData.phone && (
            <Text style={styles.infoText}>{userData.phone}</Text>
          )}
        </View>
        <View style={styles.emailRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>{userData.email}</Text>
        </View>
        <View style={styles.emailRow}>
          <Ionicons name="people-outline" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>
            {t("profile.emergency")}: {userData.emergencyContactName || "-"} (
            {userData.emergencyContactPhone || "N/A"})
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.myConcerns")}</Text>
        <View style={styles.concernsContainer}>
          {allConcerns.map((concern, index) => {
            const concernKey = concernKeyMap[concern];
            const translatedText = concernKey ? t(`concerns.${concernKey}`) : concern;
            const translatedUserConcerns = userData.concerns.map((c) => {
              const key = concernKeyMap[c];
              return key ? t(`concerns.${key}`) : c;
            });
            return (
              <Chip key={index} text={translatedText} userConcerns={translatedUserConcerns} />
            );
          })}
        </View>
      </View>

      {/* Enhanced Terms Section */}
      <LinearGradient
        colors={["#F9FFF9", "#E8F5E9"]}
        style={styles.legalCard}
      >
        <Text style={styles.legalTitle}>
          <Ionicons name="document-text-outline" size={18} color={Colors.secondary} />{" "}
          {t("profile.termsAndConditions")}
        </Text>

        {terms.map((term, index) => (
          <View key={index} style={styles.termItem}>
            <View style={styles.termIconCircle}>
              <Text style={styles.termNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.termText}>{term}</Text>
          </View>
        ))}
      </LinearGradient>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          if (typeof window !== "undefined" && Platform.OS === "web") {
            window.localStorage.removeItem("authToken");
          }
          (globalThis as any).authToken = undefined;
          router.replace("/(auth)/login");
        }}
      >
        <Text style={styles.logoutText}>{t("profile.logout")}</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <UserProvider>
      <ProfileScreenContent />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: { fontSize: 22, fontWeight: "bold", color: Colors.white },
  profileContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  avatarWrapper: { marginTop: -28 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.black,
    marginTop: 12,
  },
  infoRowCenter: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  infoText: {
    fontSize: 16,
    color: Colors.secondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    opacity: 0.6,
    marginHorizontal: 15,
    marginTop: 12,
  },
  section: { paddingHorizontal: 15, paddingTop: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.secondary,
    marginBottom: 10,
  },
  concernsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  // New Beautiful Legal Card
  legalCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#dcefdc",
  },
  legalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 14,
    textAlign: "center",
  },
  termItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  termIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  termNumber: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: "#374c37",
    lineHeight: 19,
  },
  logoutButton: {
    backgroundColor: Colors.secondary,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  defaultChip: { backgroundColor: "#e6eddc" },
  selectedChip: { backgroundColor: Colors.primary },
  defaultText: { fontSize: 14, color: "#6a7c67" },
  selectedText: { fontSize: 14, color: Colors.white },
});

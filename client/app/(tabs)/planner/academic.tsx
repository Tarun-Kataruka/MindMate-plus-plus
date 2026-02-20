import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AcademicPlannerScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#6BCB77", "#4AAE63"]}
        style={styles.headerContainer}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.iconWrapper}>
          <Ionicons name="school-outline" size={48} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>{t("planner.academicPlanner")}</Text>
        <Text style={styles.headerSubtitle}>{t("planner.subtitle")}</Text>
      </LinearGradient>

      {/* Action Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/planner/prepare")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#6BCB77", "#4AAE63"]}
            style={styles.actionCardGradient}
          >
            <View style={styles.actionCardIcon}>
              <Ionicons name="rocket-outline" size={28} color="#388e3c" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>{t("planner.prepareForExam")}</Text>
              <Text style={styles.actionCardDesc}>
                Upload materials, manage subjects & create your plan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/planner/plan")}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardOutline}>
            <View style={[styles.actionCardIcon, { backgroundColor: "#e3f2fd" }]}>
              <Ionicons name="calendar-outline" size={28} color="#1976d2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: "#333" }]}>{t("planner.viewStudyPlan")}</Text>
              <Text style={[styles.actionCardDesc, { color: "#888" }]}>
                Track progress & sync with Google Calendar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>What you can do</Text>
        {[
          { icon: "book-outline" as const, text: "Organize subjects & upload notes", color: "#7b1fa2" },
          { icon: "analytics-outline" as const, text: "AI-generated personalized study plan", color: "#1976d2" },
          { icon: "checkmark-done-outline" as const, text: "Track daily task completion", color: "#388e3c" },
          { icon: "logo-google" as const, text: "Sync schedule with Google Calendar", color: "#e53935" },
        ].map((feat, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: feat.color + "14" }]}>
              <Ionicons name={feat.icon} size={18} color={feat.color} />
            </View>
            <Text style={styles.featureText}>{feat.text}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={20} color="#8a6d00" />
        <Text style={styles.disclaimerText}>{t("planner.disclaimer")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  cardsContainer: {
    marginTop: -18,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  actionCardOutline: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
    backgroundColor: "#fff",
  },
  actionCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  actionCardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
  featuresCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF9C4",
    borderLeftWidth: 4,
    borderLeftColor: "#FBC02D",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 30,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#6d5f00",
  },
});

import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();
  const INACTIVE_COLOR = "rgba(255, 255, 255, 0.7)";
  const ACTIVE_COLOR = "#ffffff";

  const tabBarOptions = {
    tabBarActiveTintColor: ACTIVE_COLOR,
    tabBarInactiveTintColor: INACTIVE_COLOR,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarShowLabel: false,
    tabBarStyle: {
      backgroundColor: "#77C272",
      borderTopWidth: 0,
      height: Platform.OS === "ios" ? 80 : 60,
      paddingBottom: Platform.OS === "ios" ? 22 : 6,
      paddingTop: 6,
      elevation: 0,
      shadowOpacity: 0,
    },
  };

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal/journals"
        options={{
          title: t("tabs.journal"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="book.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="therapist/therapists"
        options={{
          title: t("tabs.therapist"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.2.fill" color={color} />
          ),
        }}
      />
      {/* Planner tab (visible) */}
      <Tabs.Screen
        name="planner/academic"
        options={{
          title: t("tabs.planner"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={28} color={color} />
          ),
        }}
      />
      {/* Hidden planner screens */}
      <Tabs.Screen name="planner/prepare" options={{ href: null, title: t("tabs.prepare") }} />
      <Tabs.Screen name="planner/plan" options={{ href: null, title: t("tabs.plan") }} />
      {/* Hidden screens */}
      <Tabs.Screen
        name="profile/profile"
        options={{ href: null, title: t("tabs.profile") }}
      />
      <Tabs.Screen
        name="profile/edit"
        options={{ href: null, title: t("tabs.editProfile") }}
      />
      <Tabs.Screen name="chat" options={{ href: null, title: t("tabs.chat") }} />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';

// Assuming these paths based on your file structure screenshot
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Define color constants for clarity
  const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.7)';
  const ACTIVE_COLOR = '#ffffff';

  // Define tab bar styles for a clean, cohesive look, matching the solid green background in the design
  const tabBarOptions = {
    // White icons/labels contrast better on the green bar, matching the design
    tabBarActiveTintColor: ACTIVE_COLOR, // Pure white for active
    tabBarInactiveTintColor: INACTIVE_COLOR, // Slightly dimmed white for inactive
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarStyle: {
        backgroundColor: Colors.green, // Solid green background to match the design screenshot
        borderTopWidth: 0, // Remove top border for a clean look
        height: Platform.OS === 'ios' ? 90 : 60, // Adjust height for safety area
        paddingBottom: Platform.OS === 'ios' ? 30 : 5,
        paddingTop: 5,
        elevation: 0, // Ensure no default shadow on Android
        shadowOpacity: 0, // Ensure no default shadow on iOS
    },
    tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        // Set the base color for labels to the inactive color
        color: INACTIVE_COLOR, 
    }
  };

  return (
    <Tabs screenOptions={tabBarOptions}>
      {/* 1. Home Screen (index) - Icon: House */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // Icon for Home
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />

      {/* 2. Journal Screen - Icon: Book */}
      <Tabs.Screen
        name="journal/journal"
        options={{
          title: 'Journal',
          // Icon for Journal
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="book.fill" color={color} />,
        }}
      />

      {/* 3. Therapist Screen - Icon: Person.2 (Better represents support/group) */}
      <Tabs.Screen
        name="therapist/therapist"
        options={{
          title: 'Therapist',
          // Using person.2.fill as it's a common icon for support/multiple people
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
        }}
      />

      {/* 4. Fitness Screen - Icon: Checkmark */}
      <Tabs.Screen
        name="fitness/fitness"
        options={{
          title: 'Fitness',
          // Icon for Fitness (using checkmark.circle.fill for goal tracking/fitness)
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="checkmark.circle.fill" color={color} />,
        }}
      />
      
      {/* Hidden Screens (Not in the bottom bar, but still navigable) */}
      <Tabs.Screen
        name="profile/profile"
        options={{ href: null, title: 'Profile' }} // Hidden from tabs, target for avatar click
      />
      <Tabs.Screen
        name="profile/edit"
        options={{ href: null, title: 'Edit Profile' }} // Hidden
      />
      <Tabs.Screen
        name="chat"
        options={{ href: null, title: 'Chat' }} // Hidden
      />
    </Tabs>
  );
}

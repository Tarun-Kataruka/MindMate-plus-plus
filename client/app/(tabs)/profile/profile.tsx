import React, { useState, createContext, useContext, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Assuming Colors is defined in '@/constants/theme'
const Colors = {
  primary: '#77C272', // Green
  secondary: '#388e3c', // Dark Green
  tint: '#252525', // Black/Grey
  white: '#fff',
  black: '#000',
  lightGrey: '#e0e0e0',
  yellow: '#FFC107',
};

// --- Context Setup ---

// 1. Define Types
export interface UserData {
  name: string;
  gender: string;
  age: number;
  email: string;
  phone: string;
  concerns: string[];
  avatarUrl?: string;
}

interface UserContextType {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

const initialUserData: UserData = {
  name: 'Shreya',
  gender: 'female',
  age: 19,
  email: 'shreyaguptaapril@gmail.com',
  phone: '9876543210',
  concerns: ['Anger', 'Anxiety and Panic Attacks', 'Depression', 'Sleep disorders'],
  avatarUrl: undefined,
};

// 2. Create Context
// Using 'null!' to assert non-null value for context initializer, or handle gracefully with default value
export const UserContext = createContext<UserContextType>({
  userData: initialUserData,
  setUserData: () => {},
});

// 3. Custom Hook for Consumption
export const useUser = () => useContext(UserContext);

// 4. Provider Wrapper (The root component of this file)
const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserData>(initialUserData);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

// --- Component Definitions ---

// Reusable Chip Component for Concerns
const Chip = ({ text, userConcerns }: { text: string, userConcerns: string[] }) => {
  const isSelected = userConcerns.includes(text);

  const chipStyle = [
    chipStyles.chip,
    isSelected ? chipStyles.selectedChip : chipStyles.defaultChip
  ];
  const textStyle = isSelected ? chipStyles.selectedText : chipStyles.defaultText;

  return (
    <View style={chipStyle}>
      {isSelected && <Ionicons name="checkmark-sharp" size={12} color={Colors.white} style={{ marginRight: 4 }} />}
      <Text style={textStyle}>{text}</Text>
    </View>
  );
};

// Reusable Card Component for Appointments
const AppointmentCard = ({ appointment }: any) => (
  <TouchableOpacity style={cardStyles.card} activeOpacity={0.8}>
    {/* Placeholder for image */}
    <Image 
      source={{ uri: "https://placehold.co/60x60/77C272/ffffff?text=DR" }}
      style={cardStyles.image} 
    />
    <View style={cardStyles.details}>
      <Text style={cardStyles.name}>{appointment.doctor}</Text>
      <Text style={cardStyles.specialty}>{appointment.specialty}</Text>
      <Text style={cardStyles.date}>{appointment.date}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={24} color={Colors.secondary} />
  </TouchableOpacity>
);

// MOCK Appointments Data (kept local for simplicity)
const MOCK_APPOINTMENTS = [
  { type: 'Future', doctor: 'Dr. Selkon Kane', specialty: 'Psychiatrist', date: '16-Nov-2020 | 5:00 PM', image: 'doctor_1.png' },
  { type: 'Past', doctor: 'Dr. Brain Wolfe', specialty: 'Psychologist', date: '10-Nov-2020 | 4:00 PM', image: 'doctor_2.png' },
];

export function ProfileScreenContent() {
  // 5. Consume Context (GET the latest data)
  const { userData, setUserData } = useUser(); 
  const API_BASE = (((process.env.EXPO_PUBLIC_API_URL as string) || '').replace(/\/?$/, '/'));
  const fetchProfile = useCallback(async () => {
    try {
      const token = (globalThis as any).authToken as string | undefined;
      if (!token) return;
      const res = await fetch(`${API_BASE}api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data?.user) {
        setUserData({
          name: data.user.name || '',
          gender: data.user.gender || 'other',
          age: data.user.age || 0,
          email: data.user.email || '',
          phone: data.user.phone || '',
          concerns: Array.isArray(data.user.concerns) ? data.user.concerns : [],
          // @ts-ignore
          avatarUrl: data.user.avatarUrl || undefined,
        });
      }
    } catch {}
  }, [setUserData]);
  React.useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );
  const allConcerns = ['Anger', 'Anxiety and Panic Attacks', 'Depression', 'Eating disorders', 'Self-esteem', 'Self-harm', 'Stress', 'Sleep disorders'];

  return (
    <ScrollView style={styles.container}>
      {/* Header and Edit Icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile</Text>
        {/* Navigates to the edit page */}
        <TouchableOpacity onPress={() => router.push('./edit')}>
          <Ionicons name="create-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* User Info Section */}
      <View style={styles.profileContainer}>
        <View style={styles.avatarCircle}>
          {/* Avatar (falls back to initial if no URL) */}
          <Image source={{ uri: ((userData as any).avatarUrl as string) || ("https://placehold.co/110x110/388e3c/ffffff?text=" + userData.name.charAt(0)) }} style={styles.avatar} /> 
        </View>
        {/* !!! DISPLAY NAME FROM CONTEXT !!! */}
        <Text style={styles.name}>{userData.name}</Text>
        
        {/* Gender and Age */}
        <View style={styles.infoRow}>
          <Ionicons name="transgender-outline" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>{userData.gender}</Text>
          <Ionicons name="calendar-outline" size={16} color={Colors.secondary} style={{ marginLeft: 15 }} />
          <Text style={styles.infoText}>{userData.age} yrs. old</Text>
        </View>
        
        {/* Email and Phone */}
        <View style={styles.emailRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>{userData.email}</Text>
        </View>
        <View style={styles.emailRow}>
          <Ionicons name="call-outline" size={16} color={Colors.secondary} />
          <Text style={styles.infoText}>{userData.phone}</Text>
        </View>
      </View>

      {/* Concerns Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Concerns:</Text>
        <View style={styles.concernsContainer}>
          {allConcerns.map((concern, index) => (
            <React.Fragment key={index}>
              {/* Pass the userConcerns from context */}
              <Chip text={concern} userConcerns={userData.concerns} />
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Appointments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Future Appointments</Text>
        {MOCK_APPOINTMENTS.filter(a => a.type === 'Future').map((a, i) => <AppointmentCard key={i} appointment={a} />)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past Appointments</Text>
        {MOCK_APPOINTMENTS.filter(a => a.type === 'Past').map((a, i) => <AppointmentCard key={i} appointment={a} />)}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// 6. Default Export (Wrapping the content with the Provider)
export default function ProfileScreen() {
    return (
        <UserProvider>
            <ProfileScreenContent />
        </UserProvider>
    );
}

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.primary, // Green Header
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: -10, // Pull up the content slightly
  },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.white, 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  name: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginTop: 10 }, // Name color changed to white for better contrast
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 5 },
  infoText: { fontSize: 16, color: Colors.secondary, marginLeft: 5, fontWeight: '500' },
  section: { paddingHorizontal: 15, paddingTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.secondary, marginBottom: 10 },
  concernsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});

const chipStyles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultChip: {
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
  },
  selectedChip: {
    borderColor: Colors.primary, // Green border
    backgroundColor: Colors.primary, // Green fill
  },
  defaultText: { fontSize: 14, color: Colors.secondary },
  selectedText: { fontSize: 14, color: Colors.white },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 10, backgroundColor: Colors.lightGrey },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: Colors.black },
  specialty: { fontSize: 14, color: Colors.secondary },
  date: { fontSize: 12, color: Colors.primary, marginTop: 5, fontWeight: '600' },
});

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: number;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  available: boolean;
  experience: string;
  price: string;
  image: string;
  websiteUri?: string;
}

interface Appointment {
  id: string;
  therapistName: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
}

export default function TherapistsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "Available", "Top Rated", "Nearby"];

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },
    []
  );

  const handlePermissionDenied = useCallback(() => {
    if (Platform.OS === "web") {
      window.alert(
        `Location Permission Blocked\n\n` +
          `Please enable it manually:\n\n` +
          `Chrome → 🔒 icon → Site Settings → Location → Allow\n\n` +
          `Then refresh the page.`
      );
    } else {
      Alert.alert(
        "Location Required",
        "Please enable location from app settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  }, []);

  /* ================= FETCH NEARBY (GOOGLE PLACES) ================= */

  const fetchNearbyTherapists = useCallback(
    async (latitude: number, longitude: number) => {
      const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(
        /\/$/,
        ""
      );
      if (!baseUrl) {
        Alert.alert(
          "Error",
          "API URL not configured. Set EXPO_PUBLIC_API_URL."
        );
        return;
      }
      try {
        const url = `${baseUrl}/api/therapists/nearby?lat=${encodeURIComponent(
          latitude
        )}&lng=${encodeURIComponent(longitude)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          Alert.alert(
            "Could not load therapists",
            data?.message ||
              "Server error. Ensure GOOGLE_MAPS_API_KEY is set and Places API (New) is enabled."
          );
          setTherapists([]);
          return;
        }

        const list: Therapist[] = (data.therapists || []).map(
          (t: Therapist) => ({
            ...t,
            distance: calculateDistance(
              latitude,
              longitude,
              t.latitude,
              t.longitude
            ),
          })
        );

        setTherapists(list);
      } catch (error) {
        console.error("Fetch therapists error:", error);
        Alert.alert(
          "Error",
          "Failed to fetch therapists. Check your connection and try again."
        );
        setTherapists([]);
      }
    },
    [calculateDistance]
  );

  /* ================= LOCATION ================= */

  const getLocationPermission = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (permission.canAskAgain) {
          const req = await Location.requestForegroundPermissionsAsync();
          if (req.status !== "granted") {
            handlePermissionDenied();
            return;
          }
        } else {
          handlePermissionDenied();
          return;
        }
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(current);
      await fetchNearbyTherapists(
        current.coords.latitude,
        current.coords.longitude
      );
    } catch (err) {
      console.error("Location error:", err);
      handlePermissionDenied();
    } finally {
      setLoading(false);
    }
  }, [handlePermissionDenied, fetchNearbyTherapists]);

  /* ================= AUTO LOAD ================= */

  useEffect(() => {
    getLocationPermission();
  }, [getLocationPermission]);

  /* ================= FILTER ================= */

  const getFilteredTherapists = () => {
    switch (selectedFilter) {
      case "Available":
        return therapists.filter((t) => t.available);

      case "Top Rated":
        return [...therapists].sort((a, b) => b.rating - a.rating);

      case "Nearby":
        return [...therapists].sort((a, b) => a.distance - b.distance);

      default:
        return therapists;
    }
  };

  /* ================= ACTIONS ================= */

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleBook = (therapist: Therapist) => {
    if (!therapist.available) return;

    Alert.alert("Confirm", "Book appointment?", [
      { text: "Cancel" },
      {
        text: "Book",
        onPress: () => {
          setAppointments((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              therapistName: therapist.name,
              date: "2024-12-20",
              time: "2:00 PM",
              status: "upcoming",
            },
          ]);
        },
      },
    ]);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Finding therapists...</Text>
      </SafeAreaView>
    );
  }

  /* ================= NO LOCATION ================= */

  if (!location) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="location-outline" size={80} />
        <Text style={styles.title}>Location Required</Text>

        <TouchableOpacity style={styles.retry} onPress={getLocationPermission}>
          <Text style={styles.retryText}>Enable Location</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ================= MAIN ================= */

  const filtered = getFilteredTherapists();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* HEADER */}
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <Text style={styles.headerTitle}>Find Your Therapist</Text>

          <Text style={styles.headerSub}>{filtered.length} professionals</Text>
        </LinearGradient>

        {/* FILTERS */}
        <ScrollView horizontal style={styles.filters}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setSelectedFilter(f)}
              style={[styles.chip, f === selectedFilter && styles.chipActive]}
            >
              <Text>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LIST */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No therapists found nearby. Try enabling location or increasing
              search area.
            </Text>
          </View>
        ) : (
          filtered.map((t) => (
            <View key={t.id} style={styles.card}>
              <Text style={styles.name}>{t.name}</Text>
              {t.specialty ? <Text>{t.specialty}</Text> : null}
              <Text>{t.distance.toFixed(1)} km away</Text>
              {t.address ? (
                <Text style={styles.address} numberOfLines={2}>
                  {t.address}
                </Text>
              ) : null}
              {t.rating > 0 && (
                <Text style={styles.rating}>
                  ⭐ {t.rating.toFixed(1)}
                  {t.reviews > 0 ? ` (${t.reviews})` : ""}
                </Text>
              )}

              <View style={styles.row}>
                {t.phone ? (
                  <TouchableOpacity onPress={() => handleCall(t.phone)}>
                    <Text>📞 Call</Text>
                  </TouchableOpacity>
                ) : null}
                {t.websiteUri ? (
                  <TouchableOpacity
                    onPress={() => {
                      const url = t.websiteUri ?? "";
                      if (url) Linking.openURL(url);
                    }}
                  >
                    <Text>🌐 Website</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => handleBook(t)}>
                  <Text>📅 Book</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    marginVertical: 16,
  },

  retry: {
    backgroundColor: "#667eea",
    padding: 14,
    borderRadius: 10,
  },

  retryText: {
    color: "#fff",
    fontWeight: "bold",
  },

  header: {
    padding: 24,
  },

  headerTitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  headerSub: {
    color: "#fff",
  },

  filters: {
    padding: 12,
  },

  chip: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 20,
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: "#667eea",
  },

  card: {
    backgroundColor: "#fff",
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  address: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  rating: {
    fontSize: 12,
    marginTop: 4,
  },

  empty: {
    padding: 24,
    alignItems: "center",
  },

  emptyText: {
    color: "#666",
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});

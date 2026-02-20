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
import TherapistMap from "../../../components/TherapistMap";

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
  isOpen: boolean | null;
  experience: string;
  price: string;
  image: string;
  websiteUri?: string;
}

const FILTERS = ["All", "Nearby", "Open Now"] as const;

const FILTER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: "grid-outline",
  Nearby: "location-outline",
  "Open Now": "time-outline",
};

export default function TherapistsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");

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
          `Chrome → Lock icon → Site Settings → Location → Allow\n\n` +
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
      case "Nearby":
        return [...therapists].sort((a, b) => a.distance - b.distance);
      case "Open Now":
        return therapists.filter((t) => t.isOpen === true);
      default:
        return therapists;
    }
  };

  /* ================= ACTIONS ================= */

  const openInGoogleMaps = (t: Therapist) => {
    const encodedName = encodeURIComponent(
      typeof t.name === "string" ? t.name : "Therapist"
    );
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${t.latitude},${t.longitude}&query_place_id=${t.id}`
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#6BCB77", "#4AAE63"]}
          style={styles.header}
        >
          <Ionicons
            name="heart-circle-outline"
            size={36}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.headerTitle}>Find Your Therapist</Text>
          <Text style={styles.headerSubtitle}>
            Professional support near you
          </Text>
        </LinearGradient>
        <View style={styles.centerBody}>
          <ActivityIndicator size="large" color="#77C272" />
          <Text style={styles.loadingText}>
            Finding therapists near you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= NO LOCATION STATE ================= */

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#6BCB77", "#4AAE63"]}
          style={styles.header}
        >
          <Ionicons
            name="heart-circle-outline"
            size={36}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.headerTitle}>Find Your Therapist</Text>
          <Text style={styles.headerSubtitle}>
            Professional support near you
          </Text>
        </LinearGradient>
        <View style={styles.centerBody}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="location-outline" size={48} color="#77C272" />
          </View>
          <Text style={styles.emptyTitle}>Location Required</Text>
          <Text style={styles.emptySubtext}>
            We need your location to find therapists near you
          </Text>
          <TouchableOpacity
            style={styles.greenBtn}
            onPress={getLocationPermission}
          >
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.greenBtnText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ================= MAIN RENDER ================= */

  const filtered = getFilteredTherapists();

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <TherapistMap
        latitude={location.coords.latitude}
        longitude={location.coords.longitude}
        therapists={therapists}
      />
    </View>
  );

  const renderCard = (t: Therapist) => (
    <TouchableOpacity
      key={t.id}
      style={styles.card}
      onPress={() => openInGoogleMaps(t)}
      activeOpacity={0.7}
    >
      {/* Top section: avatar + info */}
      <View style={styles.cardTop}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={22} color="#fff" />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {typeof t.name === "string" ? t.name : "Therapist"}
            </Text>
            {t.isOpen !== null && (
              <View
                style={[
                  styles.statusBadge,
                  t.isOpen ? styles.openBadge : styles.closedBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: t.isOpen ? "#4caf50" : "#e53935" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: t.isOpen ? "#388e3c" : "#c62828" },
                  ]}
                >
                  {t.isOpen ? "Open" : "Closed"}
                </Text>
              </View>
            )}
          </View>
          {t.specialty && typeof t.specialty === "string" ? (
            <Text style={styles.cardSpecialty} numberOfLines={1}>
              {t.specialty}
            </Text>
          ) : null}
          <View style={styles.cardMeta}>
            {t.rating > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color="#FFC107" />
                <Text style={styles.metaText}>
                  {t.rating.toFixed(1)}
                  {t.reviews > 0 ? ` (${t.reviews})` : ""}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={14} color="#77C272" />
              <Text style={styles.metaText}>
                {t.distance.toFixed(1)} km
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Address */}
      {t.address && typeof t.address === "string" ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color="#999" />
          <Text style={styles.addressText} numberOfLines={2}>
            {t.address}
          </Text>
        </View>
      ) : null}

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Actions */}
      <View style={styles.cardActions}>
        {t.phone ? (
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={(e) => {
              e.stopPropagation();
              handleCall(t.phone);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={15} color="#388e3c" />
            <Text style={styles.actionOutlineText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {t.websiteUri ? (
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={(e) => {
              e.stopPropagation();
              const url = t.websiteUri ?? "";
              if (url) Linking.openURL(url);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={15} color="#388e3c" />
            <Text style={styles.actionOutlineText}>Website</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.actionSolid}
          onPress={(e) => {
            e.stopPropagation();
            openInGoogleMaps(t);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={15} color="#fff" />
          <Text style={styles.actionSolidText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={["#6BCB77", "#4AAE63"]}
          style={styles.header}
        >
          <Ionicons
            name="heart-circle-outline"
            size={36}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.headerTitle}>Find Your Therapist</Text>
          <Text style={styles.headerSubtitle}>
            Professional support near you
          </Text>
        </LinearGradient>

        {/* Map */}
        {renderMap()}

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => {
            const active = f === selectedFilter;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setSelectedFilter(f)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={FILTER_ICONS[f]}
                  size={15}
                  color={active ? "#fff" : "#388e3c"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "therapist" : "therapists"} found
          </Text>
        </View>

        {/* Therapist list or empty state */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={44} color="#77C272" />
            </View>
            <Text style={styles.emptyTitle}>No Therapists Found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === "Open Now"
                ? "No therapists are open right now. Try switching to the All filter."
                : "We couldn't find therapists nearby. Try enabling location or check your internet connection."}
            </Text>
            <TouchableOpacity
              style={styles.greenBtn}
              onPress={
                selectedFilter === "Open Now"
                  ? () => setSelectedFilter("All")
                  : getLocationPermission
              }
            >
              <Ionicons
                name={
                  selectedFilter === "Open Now"
                    ? "grid-outline"
                    : "refresh-outline"
                }
                size={18}
                color="#fff"
              />
              <Text style={styles.greenBtnText}>
                {selectedFilter === "Open Now" ? "Show All" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map(renderCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FDF7",
  },
  scrollContent: {
    paddingBottom: 100,
  },

  /* Header */
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textAlign: "center",
  },

  /* Map */
  mapContainer: {
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    backgroundColor: "#fff",
  },

  /* Filters */
  filterScroll: {
    marginTop: 18,
    paddingLeft: 16,
  },
  filterContent: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: "#77C272",
  },
  chipText: {
    fontSize: 14,
    color: "#388e3c",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },

  /* Results bar */
  resultsBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  resultsText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },

  /* Card */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#77C272",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#232323",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  openBadge: {
    backgroundColor: "#e8f5e9",
  },
  closedBadge: {
    backgroundColor: "#ffebee",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardSpecialty: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: "#999",
    flex: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#77C272",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionOutlineText: {
    color: "#388e3c",
    fontWeight: "600",
    fontSize: 13,
  },
  actionSolid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#77C272",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionSolidText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Loading & empty states */
  centerBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#388e3c",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  greenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#77C272",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  greenBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

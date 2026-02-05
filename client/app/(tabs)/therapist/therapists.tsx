import React, { useState, useEffect, useRef } from 'react';
import { Colors } from "@/constants/theme";
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
  Dimensions,
  Image,
  StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  place_id: string;
}

interface Appointment {
  id: string;
  therapistName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

// Mock data generator for fields not returned by basic Places Search
const getRandomSpecialty = () => {
  const specialties = ['Clinical Psychologist', 'Psychiatrist', 'Family Therapist', 'Cognitive Behavioral Therapist', 'Trauma Specialist'];
  return specialties[Math.floor(Math.random() * specialties.length)];
};

const getRandomPrice = () => {
  const prices = ['₹1500', '₹2000', '₹2500', '₹3000', '₹1200'];
  return `${prices[Math.floor(Math.random() * prices.length)]}/session`;
};

const getRandomExperience = () => {
  return `${Math.floor(Math.random() * 20) + 5} years`;
};

export default function TherapistsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showAppointments, setShowAppointments] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filters = ['All', 'Available', 'Top Rated', 'Nearby'];

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby therapists');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      fetchNearbyTherapists(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyTherapists = async (latitude: number, longitude: number, retryCount = 0) => {
    const maxRetries = 2;

    try {
      // Use our backend proxy to avoid CORS issues on Web
      const radius = 10000; // Increased to 10km for more results
      const keyword = 'therapist psychologist psychiatrist counseling mental health';
      const type = 'health'; // Add type parameter for better results
      const url = `${process.env.EXPO_PUBLIC_API_URL}api/maps/nearby?location=${latitude},${longitude}&radius=${radius}&keyword=${keyword}&type=${type}`;

      console.log(`🔍 Fetching therapists (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      console.log(`📍 Location: ${latitude}, ${longitude}`);
      console.log(`📏 Radius: ${radius}m (${radius / 1000}km)`);
      console.log(`🔗 API URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`📊 API Response Status: ${data.status}`);
      console.log(`📊 Results count: ${data.results?.length || 0}`);

      if (data.error_message) {
        console.error(`❌ API Error: ${data.error_message}`);
      }

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const placesTherapists: Therapist[] = data.results.map((place: any) => {
          // Use our backend proxy for photos to avoid CORS issues on Web
          let imageUrl = 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            imageUrl = `${process.env.EXPO_PUBLIC_API_URL}api/maps/photo?maxwidth=400&photoreference=${photoReference}`;
          }

          const placeLat = place.geometry.location.lat;
          const placeLng = place.geometry.location.lng;

          return {
            id: place.place_id,
            place_id: place.place_id,
            name: place.name,
            specialty: getRandomSpecialty(),
            rating: place.rating || 4.5,
            reviews: place.user_ratings_total || Math.floor(Math.random() * 100),
            distance: calculateDistance(latitude, longitude, placeLat, placeLng),
            address: place.vicinity,
            phone: '+91 80000 00000',
            latitude: placeLat,
            longitude: placeLng,
            available: place.opening_hours?.open_now ?? true,
            experience: getRandomExperience(),
            price: getRandomPrice(),
            image: imageUrl
          };
        });

        setTherapists(placesTherapists);
        console.log(`✅ Successfully fetched ${placesTherapists.length} therapists from Google Places API`);
        console.log(`📋 Therapist names:`, placesTherapists.map(t => t.name).join(', '));
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('⚠️ No therapists found in the area, loading fallback data');
        loadFallbackData(latitude, longitude);
      } else {
        console.warn(`⚠️ API returned unexpected status: ${data.status}`);
        if (retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`🔄 Retrying in ${delay}ms...`);
          setTimeout(() => fetchNearbyTherapists(latitude, longitude, retryCount + 1), delay);
          return;
        }
        console.log('⚠️ Max retries reached, loading fallback data');
        loadFallbackData(latitude, longitude);
      }

      const mockAppointments: Appointment[] = [
        {
          id: '1',
          therapistName: 'Dr. Priya Sharma',
          date: '2024-12-15',
          time: '10:00 AM',
          status: 'upcoming'
        }
      ];
      setAppointments(mockAppointments);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching therapists via proxy:', error);

      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => fetchNearbyTherapists(latitude, longitude, retryCount + 1), delay);
      } else {
        console.log('Max retries reached, loading fallback data');
        loadFallbackData(latitude, longitude);
      }
    }
  };

  const loadFallbackData = (latitude: number, longitude: number) => {
    const mockTherapists: Therapist[] = [
      {
        id: '1',
        name: 'Dr. Priya Sharma',
        specialty: 'Anxiety & Depression',
        rating: 4.8,
        reviews: 127,
        distance: calculateDistance(latitude, longitude, 12.9716, 77.5946),
        address: 'Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+918012345678',
        latitude: 12.9716,
        longitude: 77.5946,
        available: true,
        experience: '12 years',
        price: '₹1500/session',
        image: 'https://i.pravatar.cc/150?img=1',
        place_id: 'mock1'
      },
      {
        id: '2',
        name: 'Dr. Rajesh Kumar',
        specialty: 'Cognitive Behavioral Therapy',
        rating: 4.9,
        reviews: 203,
        distance: calculateDistance(latitude, longitude, 12.9352, 77.6245),
        address: 'Koramangala, Bengaluru, Karnataka 560034',
        phone: '+918012345679',
        latitude: 12.9352,
        longitude: 77.6245,
        available: true,
        experience: '15 years',
        price: '₹2000/session',
        image: 'https://i.pravatar.cc/150?img=12',
        place_id: 'mock2'
      },
    ];
    setTherapists(mockTherapists);
    setLoading(false);
    setAppointments([{
      id: '1',
      therapistName: 'Dr. Priya Sharma',
      date: '2024-12-15',
      time: '10:00 AM',
      status: 'upcoming'
    }]);
  }

  const handleCallTherapist = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleGetDirections = async (latitude: number, longitude: number, address: string) => {
    if (!location) {
      Alert.alert('Error', 'Unable to get your location');
      return;
    }

    const userLat = location.coords.latitude;
    const userLng = location.coords.longitude;

    const url = Platform.select({
      ios: `maps:?saddr=${userLat},${userLng}&daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${latitude},${longitude}`;

    try {
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open maps');
    }
  };

  const handleBookAppointment = (therapist: Therapist) => {
    if (!therapist.available) {
      Alert.alert('Unavailable', 'This therapist is currently unavailable');
      return;
    }

    Alert.alert(
      'Book Appointment',
      `Book a session with ${therapist.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book',
          onPress: () => {
            const newAppointment: Appointment = {
              id: Date.now().toString(),
              therapistName: therapist.name,
              date: new Date().toISOString().split('T')[0],
              time: '2:00 PM',
              status: 'upcoming'
            };
            setAppointments([...appointments, newAppointment]);
            Alert.alert('Success', 'Appointment booked successfully!');
            setShowAppointments(true);
          }
        }
      ]
    );
  };

  const getFilteredTherapists = () => {
    switch (selectedFilter) {
      case 'Available':
        return therapists.filter(t => t.available);
      case 'Top Rated':
        return [...therapists].sort((a, b) => b.rating - a.rating);
      case 'Nearby':
        return [...therapists].sort((a, b) => a.distance - b.distance);
      default:
        return therapists;
    }
  };

  const filteredTherapists = getFilteredTherapists();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="location" size={48} color={Colors.primary} />
          </View>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Finding best therapists nearby...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Find Care</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTherapists.length} specialists nearby
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowAppointments(!showAppointments)}
            >
              <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
              {appointments.length > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickyHeaderIndices={[0]}
      >
        {/* Map Section - Always at the top now */}
        {location && (
          <View style={styles.inlineMapContainer}>
            {Platform.OS === 'web' ? (
              // Dynamically import web component to avoid bundling react-native-maps
              (() => {
                const TherapistMapWeb = require('../../../components/TherapistMap.web').default;
                return <TherapistMapWeb therapists={filteredTherapists} userLocation={location} />;
              })()
            ) : (
              // Dynamically import native component
              (() => {
                const TherapistMapNative = require('../../../components/TherapistMap').default;
                return <TherapistMapNative therapists={filteredTherapists} userLocation={location} />;
              })()
            )}
          </View>
        )}

        {showAppointments && appointments.length > 0 && (
          <View style={styles.appointmentsSection}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {appointments.map((appointment) => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentTimeContainer}>
                    <Text style={styles.appointmentTimeText}>{appointment.time}</Text>
                    <Text style={styles.appointmentDateText}>{new Date(appointment.date).getDate()}</Text>
                  </View>
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.appointmentTherapistName} numberOfLines={1}>{appointment.therapistName}</Text>
                    <View style={[styles.statusBadge, appointment.status === 'upcoming' ? styles.statusUpcoming : null]}>
                      <Text style={styles.statusText}>{appointment.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {filteredTherapists.map((therapist) => (
          <TouchableOpacity
            key={therapist.id}
            activeOpacity={0.9}
            style={styles.therapistCard}
            onPress={() => handleGetDirections(therapist.latitude, therapist.longitude, therapist.address)}
          >
            <View style={styles.cardHeader}>
              <Image source={{ uri: therapist.image }} style={styles.cardAvatar} />
              <View style={styles.cardInfo}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardName} numberOfLines={1}>{therapist.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFF" />
                    <Text style={styles.ratingText}>{therapist.rating}</Text>
                  </View>
                </View>
                <Text style={styles.cardSpecialty}>{therapist.specialty}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{therapist.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{therapist.experience}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButtonSecondary}
                onPress={() => handleCallTherapist(therapist.phone)}
              >
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButtonPrimary}
                onPress={() => handleBookAppointment(therapist)}
              >
                <Text style={styles.actionButtonText}>Book Now • {therapist.price}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }
    }) as any,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
      }
    }) as any,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8898AA',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
      }
    }) as any,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8898AA',
    fontWeight: '500',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineMapContainer: {
    width: '100%',
    height: 350,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
      }
    }) as any,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F6F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    borderWidth: 1.5,
    borderColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 4px rgba(255, 82, 82, 0.5)',
      }
    }) as any,
  },
  filterContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  filterContent: {
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F6F8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8898AA',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  appointmentsSection: {
    marginBottom: 25,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginRight: 15,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      }
    }) as any,
  },
  appointmentTimeContainer: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  appointmentTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  appointmentDateText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  appointmentTherapistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  statusUpcoming: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFA000',
    textTransform: 'uppercase',
  },
  therapistCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }
    }) as any,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  cardAvatar: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardSpecialty: {
    fontSize: 14,
    color: '#8898AA',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButtonSecondary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      }
    }) as any,
  },
  actionButtonPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    ...Platform.select({
      web: {
        boxShadow: `0px 6px 12px ${Colors.primary}40`,
        transition: 'all 0.2s ease',
      }
    }) as any,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
}

interface Appointment {
  id: string;
  therapistName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function TherapistsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showAppointments, setShowAppointments] = useState(false);

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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchNearbyTherapists = async (latitude: number, longitude: number) => {
    try {
      // TODO: Replace with your actual backend API
      // const response = await fetch(`YOUR_API_URL/therapists?lat=${latitude}&lng=${longitude}&radius=5000`);
      // const data = await response.json();
      // setTherapists(data);
      
      // For now, using Bengaluru-based mock data
      // Bengaluru coordinates: 12.9716° N, 77.5946° E
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
          image: 'https://i.pravatar.cc/150?img=1'
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
          image: 'https://i.pravatar.cc/150?img=12'
        },
        {
          id: '3',
          name: 'Dr. Ananya Reddy',
          specialty: 'Family & Relationship',
          rating: 4.7,
          reviews: 89,
          distance: calculateDistance(latitude, longitude, 13.0358, 77.5970),
          address: 'Yelahanka, Bengaluru, Karnataka 560064',
          phone: '+918012345680',
          latitude: 13.0358,
          longitude: 77.5970,
          available: false,
          experience: '10 years',
          price: '₹1200/session',
          image: 'https://i.pravatar.cc/150?img=5'
        },
        {
          id: '4',
          name: 'Dr. Vikram Patel',
          specialty: 'Trauma & PTSD',
          rating: 4.9,
          reviews: 156,
          distance: calculateDistance(latitude, longitude, 12.9698, 77.7500),
          address: 'Whitefield, Bengaluru, Karnataka 560066',
          phone: '+918012345681',
          latitude: 12.9698,
          longitude: 77.7500,
          available: true,
          experience: '18 years',
          price: '₹2500/session',
          image: 'https://i.pravatar.cc/150?img=13'
        },
        {
          id: '5',
          name: 'Dr. Meera Iyer',
          specialty: 'Stress Management',
          rating: 4.6,
          reviews: 74,
          distance: calculateDistance(latitude, longitude, 12.9141, 77.6411),
          address: 'HSR Layout, Bengaluru, Karnataka 560102',
          phone: '+918012345682',
          latitude: 12.9141,
          longitude: 77.6411,
          available: true,
          experience: '8 years',
          price: '₹1000/session',
          image: 'https://i.pravatar.cc/150?img=9'
        }
      ];

      setTherapists(mockTherapists);
      
      // Load mock appointments
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          therapistName: 'Dr. Priya Sharma',
          date: '2024-12-05',
          time: '10:00 AM',
          status: 'upcoming'
        }
      ];
      setAppointments(mockAppointments);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      Alert.alert('Error', 'Failed to fetch therapists');
      setLoading(false);
    }
  };

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
    
    // Open in Google Maps with directions
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

    // TODO: Implement booking flow
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
              date: '2024-12-10',
              time: '2:00 PM',
              status: 'upcoming'
            };
            setAppointments([...appointments, newAppointment]);
            Alert.alert('Success', 'Appointment booked successfully!');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Finding nearby therapists...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.errorContainer}
        >
          <View style={styles.errorContent}>
            <Ionicons name="location-outline" size={80} color="#fff" />
            <Text style={styles.errorTitle}>Location Required</Text>
            <Text style={styles.errorText}>
              We need your location to find the best therapists near you
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={getLocationPermission}>
              <Text style={styles.retryButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const filteredTherapists = getFilteredTherapists();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Find Your Therapist</Text>
              <Text style={styles.headerSubtitle}>
                {filteredTherapists.length} professionals ready to help
              </Text>
            </View>
            {appointments.length > 0 && (
              <TouchableOpacity 
                style={styles.appointmentBadge}
                onPress={() => setShowAppointments(!showAppointments)}
              >
                <Ionicons name="calendar" size={20} color="#667eea" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{appointments.length}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
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
      </LinearGradient>

      {showAppointments && appointments.length > 0 && (
        <View style={styles.appointmentsSection}>
          <View style={styles.appointmentsSectionHeader}>
            <Text style={styles.appointmentsSectionTitle}>My Appointments</Text>
            <TouchableOpacity onPress={() => setShowAppointments(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <Ionicons name="person-circle" size={40} color="#667eea" />
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTherapist}>{appointment.therapistName}</Text>
                    <View style={styles.appointmentDateTime}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.appointmentDate}>{appointment.date}</Text>
                    </View>
                    <View style={styles.appointmentDateTime}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.appointmentTime}>{appointment.time}</Text>
                    </View>
                  </View>
                </View>
                <View style={[
                  styles.appointmentStatus,
                  appointment.status === 'upcoming' && styles.statusUpcoming,
                  appointment.status === 'completed' && styles.statusCompleted,
                  appointment.status === 'cancelled' && styles.statusCancelled
                ]}>
                  <Text style={styles.appointmentStatusText}>
                    {appointment.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredTherapists.map((therapist, index) => (
          <View 
            key={therapist.id} 
            style={[
              styles.therapistCard,
              { 
                transform: [{ scale: 1 }],
                opacity: 1
              }
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={32} color="#667eea" />
                  </View>
                  {therapist.available && (
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                    </View>
                  )}
                </View>

                <View style={styles.therapistMainInfo}>
                  <Text style={styles.therapistName}>{therapist.name}</Text>
                  <Text style={styles.therapistSpecialty}>{therapist.specialty}</Text>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.rating}>{therapist.rating}</Text>
                      <Text style={styles.reviews}>({therapist.reviews})</Text>
                    </View>
                    <View style={styles.experienceContainer}>
                      <Ionicons name="briefcase-outline" size={14} color="#667eea" />
                      <Text style={styles.experience}>{therapist.experience}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="location" size={16} color="#667eea" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailText}>{therapist.address}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="navigate" size={16} color="#667eea" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailText}>{therapist.distance.toFixed(1)} km away</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="cash-outline" size={16} color="#667eea" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Session Fee</Text>
                    <Text style={styles.detailText}>{therapist.price}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => handleCallTherapist(therapist.phone)}
                >
                  <Ionicons name="call" size={18} color="#667eea" />
                  <Text style={styles.secondaryButtonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => handleGetDirections(therapist.latitude, therapist.longitude, therapist.address)}
                >
                  <Ionicons name="navigate" size={18} color="#667eea" />
                  <Text style={styles.secondaryButtonText}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.primaryButton,
                    !therapist.available && styles.disabledButton
                  ]}
                  disabled={!therapist.available}
                  onPress={() => handleBookAppointment(therapist)}
                >
                  <LinearGradient
                    colors={therapist.available ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
                    style={styles.primaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="calendar" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      {therapist.available ? 'Book Now' : 'Unavailable'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 32,
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
  appointmentBadge: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appointmentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  appointmentTherapist: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 13,
    color: '#666',
  },
  appointmentTime: {
    fontSize: 13,
    color: '#666',
  },
  appointmentStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: '#E3F2FD',
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#667eea',
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterContent: {
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#667eea',
  },
  listContainer: {
    flex: 1,
    paddingTop: 20,
  },
  therapistCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  therapistMainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  therapistName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  therapistSpecialty: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 8,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reviews: {
    fontSize: 12,
    color: '#666',
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  experience: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  detailsSection: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f2ff',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Platform } from 'react-native';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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

interface TherapistMapProps {
    therapists: Therapist[];
    userLocation: any;
}

export default function TherapistMap({ therapists, userLocation }: TherapistMapProps) {
    const [locationName, setLocationName] = useState<string>('Your Location');
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Debug logging
    console.log('=== TherapistMap.web Debug ===');
    console.log('API Key present:', !!apiKey);
    console.log('API Key value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
    console.log('User Location:', userLocation ? `${userLocation.coords.latitude}, ${userLocation.coords.longitude}` : 'MISSING');
    console.log('Therapists count:', therapists.length);
    console.log('==============================');

    useEffect(() => {
        // Reverse geocode to get location name
        if (userLocation && apiKey) {
            const lat = userLocation.coords.latitude;
            const lng = userLocation.coords.longitude;

            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`)
                .then(res => res.json())
                .then(data => {
                    if (data.results && data.results[0]) {
                        // Get the locality or formatted address
                        const addressComponents = data.results[0].address_components;
                        const locality = addressComponents.find((c: any) => c.types.includes('locality'));
                        setLocationName(locality?.long_name || data.results[0].formatted_address.split(',')[0]);
                    }
                })
                .catch(err => console.log('Geocoding error:', err));
        }
    }, [userLocation, apiKey]);

    if (userLocation && apiKey && !apiKey.includes('YOUR_')) {
        const lat = userLocation.coords.latitude;
        const lng = userLocation.coords.longitude;

        // Construct Enhanced Static Maps URL with custom styling
        const center = `${lat},${lng}`;

        // Add markers for top 10 therapists with custom styling
        const markers = therapists.slice(0, 10).map((t, index) =>
            `&markers=color:0xFF5252|label:${index + 1}|${t.latitude},${t.longitude}`
        ).join('');

        // User marker with custom color
        const userMarker = `&markers=color:0x4285F4|label:●|${lat},${lng}`;

        // Use higher resolution and add custom map styling
        const mapStyle = '&style=feature:poi|visibility:simplified&style=feature:road|element:geometry|color:0xf5f5f5&style=feature:water|color:0xc9e6ff';

        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=13&size=800x600&scale=2&maptype=roadmap${userMarker}${markers}${mapStyle}&key=${apiKey}`;

        console.log('Generated map URL:', staticMapUrl.substring(0, 100) + '...');
        console.log('Markers count:', therapists.slice(0, 10).length);

        return (
            <View style={styles.container}>
                <Image
                    source={{ uri: staticMapUrl }}
                    style={styles.mapImage}
                    resizeMode="cover"
                />

                {/* Gradient Overlay at top */}
                <View style={styles.topGradient}>
                    <View style={styles.locationInfoCard}>
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location" size={20} color="#4285F4" />
                        </View>
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationLabel}>Current Location</Text>
                            <Text style={styles.locationName}>{locationName}</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Info Card */}
                <View style={styles.bottomInfoCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="people" size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>{therapists.length}</Text>
                            <Text style={styles.statLabel}>Specialists</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Ionicons name="navigate" size={18} color={Colors.primary} />
                            <Text style={styles.statValue}>
                                {therapists.length > 0 ? therapists[0].distance.toFixed(1) : '0'}km
                            </Text>
                            <Text style={styles.statLabel}>Nearest</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={18} color="#FFC107" />
                            <Text style={styles.statValue}>
                                {therapists.length > 0
                                    ? (therapists.reduce((sum, t) => sum + t.rating, 0) / therapists.length).toFixed(1)
                                    : '0'}
                            </Text>
                            <Text style={styles.statLabel}>Avg Rating</Text>
                        </View>
                    </View>
                    <Text style={styles.mapHint}>
                        <Ionicons name="information-circle" size={12} color="#8898AA" />
                        {' '}Interactive map available on mobile app
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.containerFallback}>
            <Ionicons name="map-outline" size={48} color="#ccc" />
            <Text style={styles.text}>Map view is optimized for the mobile application.</Text>
            <Text style={styles.subtext}>Please download our app for the full experience.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            }
        }) as any,
    },
    containerFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 24,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
        ...Platform.select({
            web: {
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
            }
        }) as any,
    },
    locationInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            }
        }) as any,
    },
    locationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 11,
        color: '#8898AA',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationName: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '700',
        marginTop: 2,
    },
    bottomInfoCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            }
        }) as any,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
        marginTop: 6,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#8898AA',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
    },
    mapHint: {
        fontSize: 11,
        color: '#8898AA',
        textAlign: 'center',
        fontWeight: '500',
    },
    text: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
    },
    subtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
});

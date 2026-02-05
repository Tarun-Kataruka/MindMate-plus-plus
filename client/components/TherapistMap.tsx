import React from 'react';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/theme';
import * as Location from 'expo-location';

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
    place_id: string;
}

interface TherapistMapProps {
    therapists: Therapist[];
    userLocation: Location.LocationObject | null;
}

export default function TherapistMap({ therapists, userLocation }: TherapistMapProps) {
    const getMapRegion = () => {
        if (!userLocation) return undefined;

        // Default delta
        let latitudeDelta = 0.05;
        let longitudeDelta = 0.05;

        return {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta,
            longitudeDelta,
        };
    };

    if (!userLocation) return null;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={getMapRegion()}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {therapists.map(therapist => (
                    <Marker
                        key={therapist.id}
                        coordinate={{
                            latitude: therapist.latitude,
                            longitude: therapist.longitude
                        }}
                        title={therapist.name}
                        description={therapist.specialty}
                    >
                        <View style={styles.markerContainer}>
                            <Image source={{ uri: therapist.image }} style={styles.markerImage} />
                            <View style={styles.markerArrow} />
                        </View>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
            }
        }) as any,
    },
    markerImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    markerArrow: {
        position: 'absolute',
        bottom: -6,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.primary,
    },
});

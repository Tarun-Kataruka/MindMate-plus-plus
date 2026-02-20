import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
}

interface Props {
  latitude: number;
  longitude: number;
  therapists: Therapist[];
}

export default function TherapistMap({ latitude, longitude, therapists }: Props) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {therapists.map((t) => (
          <Marker
            key={t.id}
            coordinate={{ latitude: t.latitude, longitude: t.longitude }}
            title={typeof t.name === "string" ? t.name : "Therapist"}
            description={typeof t.specialty === "string" ? t.specialty : ""}
            pinColor="#4AAE63"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

import type { RefObject } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng, type MapPressEvent } from 'react-native-maps';

import { PredictionBadge } from '@/components/prediction/prediction-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DestinationOption } from '@/hooks/use-home-map';

type PredictionMapProps = {
  mapRef: RefObject<MapView | null>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  currentLocation: LatLng | null;
  destination: DestinationOption | null;
  onMapPress: (event: MapPressEvent) => void;
  onRecenter: () => void;
  congestionClass: 'Low' | 'Medium' | 'High' | null;
  confidence: number | null;
  weatherLabel: string | null;
};

export function PredictionMap({
  mapRef,
  initialRegion,
  currentLocation,
  destination,
  onMapPress,
  onRecenter,
  congestionClass,
  confidence,
  weatherLabel,
}: PredictionMapProps) {
  const routeLine = currentLocation && destination ? [currentLocation, destination.coordinate] : [];
  // Fallback to default OS provider in Expo Go or when Google Maps SDK key is not compiled in native manifest
  const provider = undefined;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText type="smallBold">Route analysis</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Choose a destination, then analyze the route using the backend model.
          </ThemedText>
        </View>
        {congestionClass ? <PredictionBadge value={congestionClass} /> : null}
      </View>

      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          provider={provider}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={onMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass
        >
          {currentLocation ? (
            <Marker
              coordinate={currentLocation}
              title="Your location"
              description="GPS position"
              pinColor="#208AEF"
            />
          ) : null}

          {destination ? (
            <Marker
              coordinate={destination.coordinate}
              title={destination.label}
              description={destination.subtitle}
              pinColor="#0F766E"
            />
          ) : null}

          {routeLine.length === 2 ? (
            <Polyline coordinates={routeLine} strokeColor="#208AEF" strokeWidth={4} />
          ) : null}
        </MapView>

        <Pressable onPress={onRecenter} style={styles.recenterButton} accessibilityRole="button">
          <ThemedText type="smallBold">Recenter</ThemedText>
        </Pressable>

        <View style={styles.overlayPill}>
          <ThemedText type="smallBold">
            {weatherLabel ? `Weather: ${weatherLabel}` : 'Weather: loading...'}
          </ThemedText>
          {confidence !== null ? (
            <ThemedText themeColor="textSecondary" type="small">
              Confidence {(confidence * 100).toFixed(1)}%
            </ThemedText>
          ) : null}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  mapFrame: {
    height: 360,
    borderRadius: Spacing.four,
    backgroundColor: '#d7ecff',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlayPill: {
    position: 'absolute',
    left: Spacing.three,
    top: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    gap: 2,
  },
  recenterButton: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#ffffff',
  },
});

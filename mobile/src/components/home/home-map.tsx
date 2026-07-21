import type { RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DestinationOption } from '@/hooks/use-home-map';

type HomeMapProps = {
  mapRef: RefObject<MapView | null>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  currentLocation: { latitude: number; longitude: number } | null;
  destination: DestinationOption | null;
  onMapPress: (event: MapPressEvent) => void;
  onRecenter: () => void;
};

export function HomeMap({
  mapRef,
  initialRegion,
  currentLocation,
  destination,
  onMapPress,
  onRecenter,
}: HomeMapProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Map preview</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          Long press or tap to place a custom destination.
        </ThemedText>
      </View>

      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={onMapPress}
          showsUserLocation={Boolean(currentLocation)}
          showsMyLocationButton={Boolean(currentLocation)}
          showsCompass
        >
          {currentLocation ? (
            <Marker
              coordinate={currentLocation}
              title="Your location"
              description="Current position from the device"
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
        </MapView>

        <Pressable onPress={onRecenter} style={styles.recenterButton} accessibilityRole="button">
          <ThemedText type="smallBold">Recenter</ThemedText>
        </Pressable>

        <View style={styles.overlayPill}>
          <ThemedText type="smallBold">Current location + destination pins</ThemedText>
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
    gap: Spacing.one,
  },
  mapFrame: {
    height: 340,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    backgroundColor: '#d7ecff',
  },
  overlayPill: {
    position: 'absolute',
    left: Spacing.three,
    top: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
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

import type { RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type MapPressEvent } from 'react-native-maps';

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
  currentRoutePolyline?: Array<{ latitude: number; longitude: number }> | null;
  alternativeRoutePolyline?: Array<{ latitude: number; longitude: number }> | null;
  routeOrigin?: { latitude: number; longitude: number } | null;
  routeDestination?: { latitude: number; longitude: number } | null;
};

export function HomeMap({
  mapRef,
  initialRegion,
  currentLocation,
  destination,
  onMapPress,
  onRecenter,
  currentRoutePolyline,
  alternativeRoutePolyline,
  routeOrigin,
  routeDestination,
}: HomeMapProps) {
  // Determine origin marker position: prioritize route calculation origin over device GPS
  const originMarkerCoord = routeOrigin || currentLocation;
  const destMarkerCoord = routeDestination || destination?.coordinate;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">A* Optimized Navigation Route</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          Red (🔴) is the standard route. Green (🟢) is the A* congestion-optimized route.
        </ThemedText>
      </View>

      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={onMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass
          mapType="standard"
        >
          {/* Origin Marker */}
          {originMarkerCoord ? (
            <Marker
              coordinate={originMarkerCoord}
              title="Origin"
              description="Starting location of the route"
              pinColor="#208AEF"
            />
          ) : null}

          {/* Destination Marker */}
          {destMarkerCoord ? (
            <Marker
              coordinate={destMarkerCoord}
              title="Destination"
              description="End point of the route"
              pinColor="#ef4444"
            />
          ) : null}

          {/* Standard Route Polyline (Red 🔴) */}
          {currentRoutePolyline && currentRoutePolyline.length > 0 ? (
            <Polyline
              coordinates={currentRoutePolyline}
              strokeColor="#ef4444"
              strokeWidth={5}
              lineDashPattern={[6, 3]}
            />
          ) : null}

          {/* A* Optimized Route Polyline (Green 🟢) */}
          {alternativeRoutePolyline && alternativeRoutePolyline.length > 0 ? (
            <Polyline
              coordinates={alternativeRoutePolyline}
              strokeColor="#22c55e"
              strokeWidth={6}
            />
          ) : null}
        </MapView>

        <Pressable onPress={onRecenter} style={styles.recenterButton} accessibilityRole="button">
          <ThemedText type="smallBold">Recenter</ThemedText>
        </Pressable>

        <View style={styles.overlayPill}>
          <ThemedText type="smallBold">
            {currentRoutePolyline ? '💡 Dual-Route Comparison Mode Active' : '📍 Place markers to calculate route'}
          </ThemedText>
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

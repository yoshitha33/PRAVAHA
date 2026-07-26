import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DestinationOption } from '@/hooks/use-home-map';

type HomeMapProps = {
  mapRef: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  currentLocation: { latitude: number; longitude: number } | null;
  destination: DestinationOption | null;
  onMapPress: (event: any) => void;
  onRecenter: () => void;
  currentRoutePolyline?: Array<{ latitude: number; longitude: number }> | null;
  alternativeRoutePolyline?: Array<{ latitude: number; longitude: number }> | null;
  routeOrigin?: { latitude: number; longitude: number } | null;
  routeDestination?: { latitude: number; longitude: number } | null;
};

export function HomeMap({
  currentLocation,
  destination,
  onRecenter,
  currentRoutePolyline,
  alternativeRoutePolyline,
  routeOrigin,
  routeDestination,
}: HomeMapProps) {
  // Center map and markers on geocoded routes instead of device physical GPS location
  const startLat = routeOrigin?.latitude ?? currentLocation?.latitude ?? 12.9716;
  const startLng = routeOrigin?.longitude ?? currentLocation?.longitude ?? 77.5946;
  const destLat = routeDestination?.latitude ?? destination?.coordinate.latitude ?? 12.9716;
  const destLng = routeDestination?.longitude ?? destination?.coordinate.longitude ?? 77.5946;

  // Format route coordinate arrays for JSON representation inside the Leaflet script
  const currentPolyJSON = JSON.stringify(
    (currentRoutePolyline || []).map((c) => [c.latitude, c.longitude])
  );

  const alternativePolyJSON = JSON.stringify(
    (alternativeRoutePolyline || []).map((c) => [c.latitude, c.longitude])
  );

  // Exclusively render OpenStreetMap using Leaflet.js inside the iframe srcDoc
  const leafletHtmlDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script>
        var startLat = ${startLat};
        var startLng = ${startLng};
        var destLat = ${destLat};
        var destLng = ${destLng};
        var currentPoints = ${currentPolyJSON};
        var altPoints = ${alternativePolyJSON};

        // Initialize Leaflet Map centered on start coordinates
        var map = L.map('map').setView([startLat, startLng], 13);

        // Load OpenStreetMap Mapnik tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add standard markers for Origin and Destination
        L.marker([startLat, startLng]).addTo(map).bindPopup('Origin');
        L.marker([destLat, destLng]).addTo(map).bindPopup('Destination').openPopup();

        var bounds = L.latLngBounds();
        bounds.extend([startLat, startLng]);
        bounds.extend([destLat, destLng]);

        // Draw Standard Route (Red Dashed Polyline)
        if (currentPoints.length > 0) {
          var polyline1 = L.polyline(currentPoints, {
            color: '#ef4444',
            weight: 5,
            dashArray: '6, 6',
            opacity: 0.8
          }).addTo(map);
          bounds.extend(polyline1.getBounds());
        }

        // Draw A* Optimized Route (Green Solid Polyline)
        if (altPoints.length > 0) {
          var polyline2 = L.polyline(altPoints, {
            color: '#22c55e',
            weight: 6,
            opacity: 0.95
          }).addTo(map);
          bounds.extend(polyline2.getBounds());
        }

        // Adjust bounds dynamically to fit both paths in viewport
        if (currentPoints.length > 0 || altPoints.length > 0) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Interactive Route Navigation Map (OpenStreetMap Mode)</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          Red Dashed line (🔴) represents standard route. Green solid line (🟢) represents A* optimized route.
        </ThemedText>
      </View>

      <View style={styles.mapFrame}>
        <iframe
          title="PRAVAHA OpenStreetMap Map"
          srcDoc={leafletHtmlDoc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: Spacing.four,
          }}
        />

        <Pressable onPress={onRecenter} style={styles.recenterButton} accessibilityRole="button">
          <ThemedText type="smallBold">Recenter</ThemedText>
        </Pressable>

        <View style={styles.overlayPill}>
          <ThemedText type="smallBold">
            {currentRoutePolyline ? '✓ OpenStreetMap Routing Layer Active' : '📍 Place markers to calculate route'}
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
    overflow: 'hidden',
  },
  overlayPill: {
    position: 'absolute',
    left: Spacing.three,
    top: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    zIndex: 10,
  },
  recenterButton: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
});

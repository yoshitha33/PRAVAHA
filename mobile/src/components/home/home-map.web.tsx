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
};

export function HomeMap({
  currentLocation,
  destination,
  onRecenter,
}: HomeMapProps) {
  const lat = destination?.coordinate.latitude ?? currentLocation?.latitude ?? 12.9716;
  const lng = destination?.coordinate.longitude ?? currentLocation?.longitude ?? 77.5946;

  // OpenStreetMap embed URL for Web preview
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Map preview (Web Mode)</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          Interactive map preview for Web browser view.
        </ThemedText>
      </View>

      <View style={styles.mapFrame}>
        <iframe
          title="PRAVAHA Web Map"
          src={osmUrl}
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
            {destination ? `Destination: ${destination.label}` : 'Bengaluru Central'}
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

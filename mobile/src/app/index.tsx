import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DestinationStrip } from '@/components/home/destination-strip';
import { HomeHero } from '@/components/home/home-hero';
import { HomeMap } from '@/components/home/home-map';
import { LocationStatusCard } from '@/components/home/location-status-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHomeMap } from '@/hooks/use-home-map';

export default function HomeScreen() {
  const {
    DESTINATIONS,
    currentLocation,
    destination,
    errorMessage,
    initialRegion,
    isLoadingLocation,
    locationPermissionGranted,
    mapRef,
    recenterMap,
    selectDestination,
    handleMapPress,
  } = useHomeMap();

  const currentLocationLabel = currentLocation
    ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
    : isLoadingLocation
      ? 'Fetching GPS fix'
      : 'Using Bengaluru fallback';

  const destinationLabel = destination
    ? `${destination.label} · ${destination.subtitle}`
    : 'No destination selected yet';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HomeHero />

          <LocationStatusCard
            permissionGranted={locationPermissionGranted}
            isLoadingLocation={isLoadingLocation}
            errorMessage={errorMessage}
            currentLocationLabel={currentLocationLabel}
            destinationLabel={destinationLabel}
          />

          <HomeMap
            mapRef={mapRef}
            initialRegion={initialRegion}
            currentLocation={currentLocation}
            destination={destination}
            onMapPress={handleMapPress}
            onRecenter={recenterMap}
          />

          <DestinationStrip
            destinations={DESTINATIONS}
            selectedDestinationId={destination?.id ?? null}
            onSelectDestination={selectDestination}
            onRecenter={recenterMap}
          />

          <ThemedView type="backgroundElement" style={styles.footerNote}>
            <ThemedText themeColor="textSecondary" type="small">
              Map interactions are wired for current position, preset Bangalore hotspots, and custom destination pins.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  footerNote: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
  },
});

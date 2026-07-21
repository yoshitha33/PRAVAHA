import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeMap } from '@/components/home/home-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useHomeMap } from '@/hooks/use-home-map';
import { calculateRoute, type RouteResponse } from '@/services/api';

export default function MapScreen() {
  const router = useRouter();
  const homeMap = useHomeMap();
  const [originInput, setOriginInput] = useState('Marathahalli, Bengaluru');
  const [destinationInput, setDestinationInput] = useState('Silk Board Junction, Bengaluru');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);

  async function handleFindRoute() {
    if (!destinationInput) return;
    try {
      setLoadingRoute(true);
      const res = await calculateRoute(originInput, destinationInput);
      setRouteResult(res);
    } catch {
      // Handled in api fallback
    } finally {
      setLoadingRoute(false);
    }
  }

  function handleUseCurrentLocation() {
    if (homeMap.currentLocation) {
      setOriginInput('Current GPS Location');
    } else {
      setOriginInput('Marathahalli, Bengaluru');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">🗺️ A* Risk-Weighted Route Optimizer</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Predictive Bangalore navigation powered by Google Maps API & Risk-Weighted A* Algorithm
          </ThemedText>
        </View>

        {/* Risk Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
            <ThemedText type="smallBold">🟢 Low Risk</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
            <ThemedText type="smallBold">🟡 Medium Risk</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <ThemedText type="smallBold">🔴 High Risk</ThemedText>
          </View>
        </View>

        {/* Map View */}
        <HomeMap
          mapRef={homeMap.mapRef}
          initialRegion={homeMap.initialRegion}
          currentLocation={homeMap.currentLocation}
          destination={homeMap.destination}
          onMapPress={homeMap.handleMapPress}
          onRecenter={homeMap.recenterMap}
        />

        {/* Professional Address Inputs Card (From & To) */}
        <ThemedView type="backgroundElement" style={styles.searchCard}>
          <View style={styles.inputHeaderRow}>
            <ThemedText type="smallBold">Route Addresses</ThemedText>
            <Pressable onPress={handleUseCurrentLocation} style={styles.gpsChip}>
              <ThemedText type="small" style={styles.gpsText}>📍 Use Current GPS</ThemedText>
            </Pressable>
          </View>

          {/* From Address */}
          <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textSecondary">From (Origin):</ThemedText>
            <TextInput
              style={styles.input}
              value={originInput}
              onChangeText={setOriginInput}
              placeholder="e.g. Marathahalli or Silk Board..."
            />
          </View>

          {/* To Address */}
          <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textSecondary">To (Destination):</ThemedText>
            <TextInput
              style={styles.input}
              value={destinationInput}
              onChangeText={setDestinationInput}
              placeholder="e.g. Whitefield ITPL or Electronic City..."
            />
          </View>

          {/* Find Route Button */}
          <Pressable
            style={({ pressed }) => [styles.findButton, pressed && styles.pressed]}
            onPress={handleFindRoute}
            disabled={loadingRoute}
          >
            {loadingRoute ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.findButtonText}>⚡ Calculate Risk-Weighted A* Route</ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {/* Backend Prediction & Reroute Reason Result Card */}
        {routeResult ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={styles.resultTitle}>
                  A* Pathfinding Analysis
                </ThemedText>
                <ThemedText type="small" style={{ color: '#0369a1' }}>
                  {routeResult.origin} ➔ {routeResult.destination}
                </ThemedText>
              </View>

              <View style={styles.dnaBadge}>
                <ThemedText style={styles.dnaBadgeText}>
                  Road DNA: {routeResult.road_dna}
                </ThemedText>
              </View>
            </View>

            {/* Time Saved Highlight */}
            <View style={styles.timeSavedBadge}>
              <ThemedText style={styles.timeSavedText}>
                🚀 {routeResult.time_saved} via A* Rerouting
              </ThemedText>
            </View>

            {/* Reason Behind Rerouting Box */}
            <View style={styles.reasonBox}>
              <ThemedText type="smallBold" style={styles.reasonTitle}>
                🧠 Reason Behind Rerouting:
              </ThemedText>
              <ThemedText style={styles.reasonText}>
                {routeResult.reroute_reason}
              </ThemedText>
            </View>

            {/* Route Details Navigation Button */}
            <Pressable
              style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/route-details',
                  params: {
                    origin: routeResult.origin,
                    destination: routeResult.destination,
                    currentName: routeResult.current_route.name,
                    currentDistance: routeResult.current_route.distance,
                    currentEta: routeResult.current_route.eta,
                    currentDna: String(routeResult.current_route.road_dna),
                    currentRisk: routeResult.current_route.risk,
                    altName: routeResult.alternative_route.name,
                    altDistance: routeResult.alternative_route.distance,
                    altEta: routeResult.alternative_route.eta,
                    altDna: String(routeResult.alternative_route.road_dna),
                    altRisk: routeResult.alternative_route.risk,
                    reason: routeResult.reroute_reason,
                    timeSaved: routeResult.time_saved,
                  },
                })
              }
            >
              <ThemedText style={styles.detailsButtonText}>
                🚗 View Detailed A* Route Comparison
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  searchCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#ffffff',
    fontSize: 15,
  },
  findButton: {
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  findButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
  resultCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    color: '#0369a1',
    fontSize: 17,
  },
  dnaBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  dnaBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  timeSavedBadge: {
    backgroundColor: '#dcfce7',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
  },
  timeSavedText: {
    color: '#15803d',
    fontWeight: '800',
  },
  reasonBox: {
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    gap: 4,
  },
  reasonTitle: {
    color: '#0369a1',
  },
  reasonText: {
    color: '#334155',
    lineHeight: 20,
    fontSize: 13,
  },
  detailsButton: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  detailsButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});

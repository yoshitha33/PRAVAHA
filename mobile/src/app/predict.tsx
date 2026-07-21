import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { DestinationStrip } from '@/components/home/destination-strip';
import { PredictionMap } from '@/components/prediction/prediction-map';
import { PredictionBadge } from '@/components/prediction/prediction-badge';
import { TrafficField } from '@/components/prediction/traffic-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTrafficPrediction } from '@/hooks/use-traffic-prediction';

export default function PredictionScreen() {
  const {
    mapRef,
    initialRegion,
    currentLocation,
    destination,
    errorMessage,
    isPredicting,
    isWeatherLoading,
    result,
    routeSuggestion,
    weatherLabel,
    form,
    setForm,
    recenterMap,
    selectDestination,
    handleMapPress,
    DESTINATIONS,
    analyzeRoute,
  } = useTrafficPrediction();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Predict on the map</ThemedText>
          <ThemedText themeColor="textSecondary">
            Pick a destination on Google Maps, load live weather from the backend, and analyze congestion.
          </ThemedText>
        </View>

        <PredictionMap
          mapRef={mapRef}
          initialRegion={initialRegion}
          currentLocation={currentLocation}
          destination={destination}
          onMapPress={handleMapPress}
          onRecenter={recenterMap}
          congestionClass={result?.congestionClass ?? null}
          confidence={result?.confidence ?? null}
          weatherLabel={weatherLabel}
        />

        <ThemedView type="backgroundElement" style={styles.summaryCard}>
          <ThemedText type="smallBold">Suggested Route</ThemedText>
          <ThemedText themeColor="textSecondary">{routeSuggestion}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isWeatherLoading ? 'Loading live weather from backend...' : 'Weather is pulled from the backend before prediction.'}
          </ThemedText>
        </ThemedView>

        <DestinationStrip
          destinations={DESTINATIONS}
          selectedDestinationId={destination?.id ?? null}
          onSelectDestination={selectDestination}
          onRecenter={recenterMap}
        />

        <ThemedView type="backgroundElement" style={styles.card}>
          <TrafficField label="Date" value={form.date} onChangeText={(value) => setForm({ ...form, date: value })} placeholder="YYYY-MM-DD" />
          <TrafficField label="Area Name" value={form.areaName} onChangeText={(value) => setForm({ ...form, areaName: value })} />
          <TrafficField label="Road / Intersection Name" value={form.roadIntersectionName} onChangeText={(value) => setForm({ ...form, roadIntersectionName: value })} />
          <TrafficField label="Traffic Volume" value={form.trafficVolume} onChangeText={(value) => setForm({ ...form, trafficVolume: value })} keyboardType="numeric" />
          <TrafficField label="Average Speed" value={form.averageSpeed} onChangeText={(value) => setForm({ ...form, averageSpeed: value })} keyboardType="numeric" />
          <TrafficField label="Travel Time Index" value={form.travelTimeIndex} onChangeText={(value) => setForm({ ...form, travelTimeIndex: value })} keyboardType="numeric" />
          <TrafficField label="Road Capacity Utilization" value={form.roadCapacityUtilization} onChangeText={(value) => setForm({ ...form, roadCapacityUtilization: value })} keyboardType="numeric" />
          <TrafficField label="Incident Reports" value={form.incidentReports} onChangeText={(value) => setForm({ ...form, incidentReports: value })} keyboardType="numeric" />
          <TrafficField label="Environmental Impact" value={form.environmentalImpact} onChangeText={(value) => setForm({ ...form, environmentalImpact: value })} keyboardType="numeric" />
          <TrafficField label="Public Transport Usage" value={form.publicTransportUsage} onChangeText={(value) => setForm({ ...form, publicTransportUsage: value })} keyboardType="numeric" />
          <TrafficField label="Traffic Signal Compliance" value={form.trafficSignalCompliance} onChangeText={(value) => setForm({ ...form, trafficSignalCompliance: value })} keyboardType="numeric" />
          <TrafficField label="Parking Usage" value={form.parkingUsage} onChangeText={(value) => setForm({ ...form, parkingUsage: value })} keyboardType="numeric" />
          <TrafficField label="Pedestrian and Cyclist Count" value={form.pedestrianAndCyclistCount} onChangeText={(value) => setForm({ ...form, pedestrianAndCyclistCount: value })} keyboardType="numeric" />
          <TrafficField label="Weather Conditions" value={form.weatherConditions} onChangeText={(value) => setForm({ ...form, weatherConditions: value })} />
          <TrafficField label="Roadwork and Construction Activity" value={form.roadworkAndConstructionActivity} onChangeText={(value) => setForm({ ...form, roadworkAndConstructionActivity: value })} />

          <View style={styles.buttonRow}>
            <View style={styles.buttonShell}>
              <ThemedView type="backgroundSelected" style={styles.button} onTouchEnd={analyzeRoute}>
                {isPredicting ? <ActivityIndicator color="#ffffff" /> : <ThemedText type="smallBold" style={styles.buttonText}>Predict Congestion</ThemedText>}
              </ThemedView>
            </View>
          </View>
        </ThemedView>

        {errorMessage ? (
          <ThemedView type="backgroundSelected" style={styles.errorBox}>
            <ThemedText themeColor="textSecondary">{errorMessage}</ThemedText>
          </ThemedView>
        ) : null}

        {result ? (
          <ThemedView type="backgroundElement" style={styles.resultCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Predicted Congestion
            </ThemedText>
            <PredictionBadge value={result.congestionClass} />
            <View style={styles.resultLine}>
              <ThemedText type="smallBold">Confidence</ThemedText>
              <ThemedText>{(result.confidence * 100).toFixed(2)}%</ThemedText>
            </View>
            <View style={styles.resultLine}>
              <ThemedText type="smallBold">Timestamp</ThemedText>
              <ThemedText>{new Date(result.timestamp).toLocaleString()}</ThemedText>
            </View>
          </ThemedView>
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
    gap: Spacing.two,
  },
  summaryCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  destinationStrip: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  destinationScroll: {
    gap: Spacing.two,
  },
  destinationChipWrap: {
    width: 220,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  buttonRow: {
    marginTop: Spacing.two,
  },
  buttonShell: {
    alignSelf: 'stretch',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: Spacing.three,
  },
  buttonText: {
    color: '#ffffff',
  },
  errorBox: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
  },
  resultCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  resultLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});

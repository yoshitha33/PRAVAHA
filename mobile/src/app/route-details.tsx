import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function RouteDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const origin = (params.origin as string) ?? 'Marathahalli, Bengaluru';
  const destination = (params.destination as string) ?? 'Silk Board Junction, Bengaluru';

  const currentName = (params.currentName as string) ?? 'Via Silk Board Main Flyover';
  const currentDistance = (params.currentDistance as string) ?? '14.2 km';
  const currentEta = (params.currentEta as string) ?? '45 min';
  const currentDna = (params.currentDna as string) ?? '84';
  const currentRisk = (params.currentRisk as string) ?? 'High';

  const altName = (params.altName as string) ?? 'Via Koramangala 100ft Inner Ring Rd (A* Optimized)';
  const altDistance = (params.altDistance as string) ?? '15.1 km';
  const altEta = (params.altEta as string) ?? '31 min';
  const altDna = (params.altDna as string) ?? '34';
  const altRisk = (params.altRisk as string) ?? 'Low';

  const reason =
    (params.reason as string) ??
    'Severe congestion & waterlogging risk on Silk Board Junction (Road DNA: 84). Risk-Weighted A* algorithm reroutes via Koramangala 100ft Inner Ring Road to bypass 25-minute bottleneck.';
  const timeSaved = (params.timeSaved as string) ?? '14 min saved';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">🚗 Risk-Weighted A* Route Details</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            📍 {origin} ➔ {destination}
          </ThemedText>
        </View>

        {/* Reason Behind Rerouting Highlight Box */}
        <View style={styles.reasonCard}>
          <View style={styles.reasonHeaderRow}>
            <ThemedText type="smallBold" style={styles.reasonHeaderTitle}>
              🧠 Reason Behind Rerouting
            </ThemedText>
            <View style={styles.savedChip}>
              <ThemedText style={styles.savedChipText}>⚡ {timeSaved}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.reasonText}>{reason}</ThemedText>
        </View>

        {/* Current Route Card (High Risk) */}
        <View style={[styles.routeCard, styles.currentCard]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={styles.currentTitle}>
                Original Route
              </ThemedText>
              <ThemedText type="small" style={{ color: '#991b1b' }}>
                {currentName}
              </ThemedText>
            </View>
            <View style={[styles.riskTag, { backgroundColor: '#ef4444' }]}>
              <ThemedText style={styles.riskText}>Risk: {currentRisk}</ThemedText>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>Distance</ThemedText>
              <ThemedText style={styles.metricValue}>{currentDistance}</ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>ETA</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#dc2626' }]}>{currentEta}</ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>Road DNA</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#ef4444' }]}>{currentDna}</ThemedText>
            </View>
          </View>
        </View>

        {/* Alternative Route Card (A* Recommended Low Risk) */}
        <View style={[styles.routeCard, styles.altCard]}>
          <View style={styles.recommendedBanner}>
            <ThemedText style={styles.bannerText}>⭐ A* OPTIMIZED RECOMMENDED ROUTE</ThemedText>
          </View>

          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={styles.altTitle}>
                Alternative A* Route
              </ThemedText>
              <ThemedText type="small" style={{ color: '#166534' }}>
                {altName}
              </ThemedText>
            </View>
            <View style={[styles.riskTag, { backgroundColor: '#22c55e' }]}>
              <ThemedText style={styles.riskText}>Risk: {altRisk}</ThemedText>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>Distance</ThemedText>
              <ThemedText style={styles.metricValue}>{altDistance}</ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>ETA</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#16a34a' }]}>{altEta}</ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText type="small" style={styles.metricLabel}>Road DNA</ThemedText>
              <ThemedText style={[styles.metricValue, { color: '#16a34a' }]}>{altDna}</ThemedText>
            </View>
          </View>

          <ThemedText type="small" style={styles.altSavings}>
            💡 Cost Function penalty avoided: Road DNA score reduced from {currentDna} to {altDna}!
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
            onPress={() => router.push('/map')}
          >
            <ThemedText style={styles.selectText}>🚀 Start Navigation via A* Optimized Route</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <ThemedText type="smallBold" themeColor="textSecondary">
              Back to Map
            </ThemedText>
          </Pressable>
        </View>
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
  reasonCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    borderLeftWidth: 5,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonHeaderTitle: {
    color: '#0369a1',
    fontSize: 16,
  },
  savedChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savedChipText: {
    color: '#15803d',
    fontWeight: '800',
    fontSize: 12,
  },
  reasonText: {
    color: '#334155',
    lineHeight: 20,
    fontSize: 13,
  },
  routeCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    elevation: 3,
  },
  currentCard: {
    borderColor: '#fca5a5',
  },
  altCard: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  recommendedBanner: {
    backgroundColor: '#15803d',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTitle: {
    color: '#991b1b',
  },
  altTitle: {
    color: '#166534',
  },
  riskTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
  },
  riskText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  altSavings: {
    color: '#15803d',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  selectButton: {
    height: 52,
    backgroundColor: '#0284c7',
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
});

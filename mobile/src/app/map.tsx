import { useState, useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { HomeMap } from '@/components/home/home-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { NAV_HEIGHT } from '@/constants/theme';
import { useHomeMap } from '@/hooks/use-home-map';
import { calculateRoute, type RouteResponse } from '@/services/api';

// Congestion causes based on common Bangalore traffic patterns
const CONGESTION_CAUSES: Record<string, { icon: string; title: string; detail: string }[]> = {
  High: [
    { icon: '🌧️', title: 'Waterlogging', detail: 'Heavy rains causing 30cm water accumulation at key underpasses, blocking lanes.' },
    { icon: '🚧', title: 'Road Narrowing', detail: 'Metro/flyover construction reducing road from 4 lanes to 2 lanes.' },
    { icon: '🏟️', title: 'Event Exit Traffic', detail: 'IPL/Concert exit crowds simultaneously flooding adjacent corridors.' },
    { icon: '🚦', title: 'Signal Failure', detail: 'Signal malfunction forcing manual traffic control — severe slowdown.' },
  ],
  Medium: [
    { icon: '🕗', title: 'Peak Hour Load', detail: 'Office rush hour (8–10AM / 5–8PM) increasing vehicle density by 3x.' },
    { icon: '🚌', title: 'Bus Bunching', detail: 'BMTC buses stopping mid-lane near major stops reduces road width.' },
    { icon: '🏗️', title: 'Utility Works', detail: 'BWSSB/BESCOM pipeline or cable works temporarily narrowing roads.' },
  ],
  Low: [
    { icon: '✅', title: 'Clear Traffic', detail: 'Off-peak hours with low vehicle density. Road DNA score is optimal.' },
  ],
};

function getCongestionCauses(congestion: string, delayReason: string) {
  const base = CONGESTION_CAUSES[congestion] || CONGESTION_CAUSES['Low'];
  // Inject the actual backend delay reason as the first, most specific cause
  return [
    { icon: '⚠️', title: 'Detected Issue', detail: delayReason },
    ...base.slice(0, 2),
  ];
}

export default function MapScreen() {
  const homeMap = useHomeMap();
  const [originInput, setOriginInput] = useState('Marathahalli, Bengaluru');
  const [destinationInput, setDestinationInput] = useState('Silk Board Junction, Bengaluru');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function loadGPS() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setOriginInput('Current GPS Location');
          homeMap.mapRef.current?.animateToRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }
      } catch (err) {
        console.log('GPS notice:', err);
      }
    }
    loadGPS();
  }, []);

  async function handleFindRoute() {
    if (!originInput || !destinationInput) {
      Alert.alert('Missing input', 'Please enter both origin and destination.');
      return;
    }
    try {
      setLoadingRoute(true);
      setRouteResult(null);
      setErrorMsg(null);

      const res = await calculateRoute(originInput, destinationInput);
      setRouteResult(res);

      const allCoords = [
        ...(res.current_route?.polyline || []),
        ...(res.alternative_route?.polyline || []),
      ];
      if (allCoords.length > 0) {
        setTimeout(() => {
          homeMap.mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }, 300);
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not connect to backend. Is the server running?';
      console.error('[PRAVAHA] Route error:', msg);
      setErrorMsg(msg);
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

  const causes = routeResult
    ? getCongestionCauses(routeResult.congestion, routeResult.current_route.delay_reason || 'Traffic delay detected on this route.')
    : [];

  const congestionColor = (c: string) =>
    c === 'High' ? '#dc2626' : c === 'Medium' ? '#d97706' : '#16a34a';
  const congestionBg = (c: string) =>
    c === 'High' ? '#fff1f2' : c === 'Medium' ? '#fffbeb' : '#f0fdf4';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">🗺️ A* Risk-Weighted Route Optimizer</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Real streets · Street-by-street routing · Live congestion reasons
          </ThemedText>
        </View>

        {/* Map */}
        <HomeMap
          mapRef={homeMap.mapRef}
          initialRegion={homeMap.initialRegion}
          currentLocation={homeMap.currentLocation}
          destination={homeMap.destination}
          onMapPress={homeMap.handleMapPress}
          onRecenter={homeMap.recenterMap}
          currentRoutePolyline={routeResult?.current_route?.polyline}
          alternativeRoutePolyline={routeResult?.alternative_route?.polyline}
          routeOrigin={routeResult ? { latitude: routeResult.origin_lat, longitude: routeResult.origin_lng } : null}
          routeDestination={routeResult ? { latitude: routeResult.destination_lat, longitude: routeResult.destination_lng } : null}
        />

        {/* Map Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#ef4444', borderStyle: 'dashed', borderWidth: 1 }]} />
            <ThemedText type="small">Normal Route (Red)</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#22c55e' }]} />
            <ThemedText type="small">A* Optimized (Green)</ThemedText>
          </View>
        </View>

        {/* Input Form */}
        <ThemedView type="backgroundElement" style={styles.searchCard}>
          <View style={styles.inputHeaderRow}>
            <ThemedText type="smallBold" style={{ color: '#0f172a' }}>Route Address Inputs</ThemedText>
            <Pressable onPress={handleUseCurrentLocation} style={styles.gpsChip}>
              <ThemedText type="small" style={styles.gpsText}>📍 My GPS Location</ThemedText>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textSecondary">Origin (Start Point):</ThemedText>
            <TextInput
              style={styles.input}
              value={originInput}
              onChangeText={setOriginInput}
              placeholder="e.g. Indiranagar, Hebbal, JP Nagar..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText type="small" themeColor="textSecondary">Destination (End Point):</ThemedText>
            <TextInput
              style={styles.input}
              value={destinationInput}
              onChangeText={setDestinationInput}
              placeholder="e.g. Whitefield, Electronic City..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.findButton, pressed && styles.pressed]}
            onPress={handleFindRoute}
            disabled={loadingRoute}
          >
            {loadingRoute ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.findButtonText}>⚡ Calculate A* Route</Text>
            )}
          </Pressable>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <ThemedText type="small" style={{ color: '#b91c1c' }}>
                ❌ {errorMsg}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        {/* Route Result Panel */}
        {routeResult ? (
          <View style={styles.resultPanel}>

            {/* Route Header */}
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={styles.resultTitle}>Route Comparison</ThemedText>
                <ThemedText type="small" style={{ color: '#0369a1', marginTop: 2 }}>
                  {routeResult.origin} ➔ {routeResult.destination}
                </ThemedText>
              </View>
              <View style={[styles.savedBadge, { backgroundColor: '#dcfce7' }]}>
                <ThemedText style={styles.savedText}>🚀 {routeResult.time_saved}</ThemedText>
              </View>
            </View>

            {/* Side-by-Side ETA */}
            <View style={styles.etaRow}>
              {/* Normal Route */}
              <View style={[styles.etaBox, styles.etaRed]}>
                <ThemedText style={styles.etaLabel}>🔴 Normal Route</ThemedText>
                <ThemedText style={styles.etaTime}>{routeResult.current_route.eta}</ThemedText>
                <ThemedText style={styles.etaSub}>{routeResult.current_route.distance}</ThemedText>
                <View style={[styles.dnaBadge, { backgroundColor: '#fee2e2' }]}>
                  <ThemedText style={{ color: '#dc2626', fontWeight: '700', fontSize: 11 }}>
                    DNA: {routeResult.current_route.road_dna}
                  </ThemedText>
                </View>
              </View>

              {/* VS Divider */}
              <View style={styles.vsDivider}>
                <ThemedText style={styles.vsText}>VS</ThemedText>
              </View>

              {/* A* Optimized */}
              <View style={[styles.etaBox, styles.etaGreen]}>
                <ThemedText style={styles.etaLabelGreen}>🟢 A* Optimized</ThemedText>
                <ThemedText style={styles.etaTimeGreen}>{routeResult.alternative_route.eta}</ThemedText>
                <ThemedText style={styles.etaSubGreen}>{routeResult.alternative_route.distance}</ThemedText>
                <View style={[styles.dnaBadge, { backgroundColor: '#dcfce7' }]}>
                  <ThemedText style={{ color: '#15803d', fontWeight: '700', fontSize: 11 }}>
                    DNA: {routeResult.alternative_route.road_dna}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Congestion Level Banner */}
            <View style={[styles.congestionBanner, { backgroundColor: congestionBg(routeResult.congestion) }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ThemedText style={{ fontSize: 18 }}>
                  {routeResult.congestion === 'High' ? '🔴' : routeResult.congestion === 'Medium' ? '🟡' : '🟢'}
                </ThemedText>
                <View>
                  <ThemedText style={[styles.congestionLabel, { color: congestionColor(routeResult.congestion) }]}>
                    {routeResult.congestion} Congestion Detected
                  </ThemedText>
                  <ThemedText style={{ color: '#64748b', fontSize: 12 }}>
                    Road DNA Score: {routeResult.road_dna} / 100
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Why is the Normal Route Slow — Reasons */}
            <View style={styles.reasonsSection}>
              <ThemedText style={styles.reasonsHeader}>
                ⚠️ Why Is the Normal Route Slow?
              </ThemedText>
              {causes.map((cause, idx) => (
                <View key={idx} style={styles.causeCard}>
                  <ThemedText style={styles.causeIcon}>{cause.icon}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.causeTitle}>{cause.title}</ThemedText>
                    <ThemedText style={styles.causeDetail}>{cause.detail}</ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {/* A* Logic Explanation */}
            <View style={styles.logicCard}>
              <ThemedText style={styles.logicTitle}>🧠 How A* Optimizer Helps</ThemedText>
              <ThemedText style={styles.logicText}>{routeResult.reroute_reason}</ThemedText>
            </View>

            {/* View Full Route Details */}
            <Pressable
              style={({ pressed }) => [styles.detailsBtn, pressed && styles.pressed]}
              onPress={() => setShowDetails(true)}
            >
              <Text style={styles.detailsBtnText}>📋 View Full Route Details & Analysis</Text>
              <Text style={styles.detailsBtnArrow}>→</Text>
            </Pressable>

          </View>
        ) : null}
      </ScrollView>

      {/* ── Route Details Modal ─────────────────────────────────────────── */}
      {routeResult && (
        <Modal
          visible={showDetails}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetails(false)}
        >
          <View style={styles.modalRoot}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Route Details & Analysis</Text>
              <Pressable onPress={() => setShowDetails(false)} hitSlop={12} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>

              {/* Origin → Destination */}
              <Text style={styles.modalRoute}>
                📍 {routeResult.origin}  →  {routeResult.destination}
              </Text>

              {/* Reason Behind Rerouting */}
              <View style={styles.detailReasonCard}>
                <View style={styles.detailReasonHeader}>
                  <Ionicons name="analytics-outline" size={18} color="#0369a1" />
                  <Text style={styles.detailReasonTitle}>Why the Normal Route Is Slow</Text>
                  <View style={styles.savedChip}>
                    <Text style={styles.savedChipText}>⚡ {routeResult.time_saved}</Text>
                  </View>
                </View>
                <Text style={styles.detailReasonBody}>{routeResult.reroute_reason}</Text>
                {routeResult.current_route.delay_reason ? (
                  <View style={styles.delayAlert}>
                    <Ionicons name="warning-outline" size={15} color="#b91c1c" />
                    <Text style={styles.delayAlertText}>{routeResult.current_route.delay_reason}</Text>
                  </View>
                ) : null}
              </View>

              {/* Normal Route Card */}
              <View style={[styles.detailRouteCard, styles.detailCardRed]}>
                <View style={styles.detailCardHeader}>
                  <View style={styles.detailRiskBadge}>
                    <Text style={styles.detailRiskText}>⚠️ {routeResult.current_route.risk} Risk</Text>
                  </View>
                  <Text style={styles.detailCardLabel}>Normal Route</Text>
                </View>
                <Text style={styles.detailRouteName} numberOfLines={2}>{routeResult.current_route.name}</Text>
                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>Distance</Text>
                    <Text style={styles.detailMetricValue}>{routeResult.current_route.distance}</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>ETA</Text>
                    <Text style={[styles.detailMetricValue, { color: '#dc2626' }]}>{routeResult.current_route.eta}</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>Road DNA</Text>
                    <Text style={[styles.detailMetricValue, { color: '#ef4444' }]}>{routeResult.current_route.road_dna}</Text>
                  </View>
                </View>
              </View>

              {/* A* Route Card */}
              <View style={[styles.detailRouteCard, styles.detailCardGreen]}>
                <View style={styles.detailCardHeader}>
                  <View style={[styles.detailRiskBadge, { backgroundColor: '#15803d' }]}>
                    <Text style={styles.detailRiskText}>✅ A* Optimized</Text>
                  </View>
                  <Text style={styles.detailCardLabel}>Recommended Route</Text>
                </View>
                <Text style={styles.detailRouteName} numberOfLines={2}>{routeResult.alternative_route.name}</Text>
                <View style={styles.detailMetricsRow}>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>Distance</Text>
                    <Text style={styles.detailMetricValue}>{routeResult.alternative_route.distance}</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>ETA</Text>
                    <Text style={[styles.detailMetricValue, { color: '#16a34a' }]}>{routeResult.alternative_route.eta}</Text>
                  </View>
                  <View style={styles.detailMetric}>
                    <Text style={styles.detailMetricLabel}>Road DNA</Text>
                    <Text style={[styles.detailMetricValue, { color: '#16a34a' }]}>{routeResult.alternative_route.road_dna}</Text>
                  </View>
                </View>
                <Text style={styles.detailSavings}>
                  💡 DNA reduced from {routeResult.current_route.road_dna} → {routeResult.alternative_route.road_dna} · {routeResult.time_saved}
                </Text>
              </View>

              {/* Close button */}
              <Pressable
                style={({ pressed }) => [styles.detailsBtn, { marginTop: 4 }, pressed && styles.pressed]}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.detailsBtnText}>← Back to Map</Text>
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: NAV_HEIGHT },
  content: { padding: Spacing.four, gap: Spacing.four, maxWidth: 800, width: '100%', alignSelf: 'center' as const },
  header: { gap: Spacing.one },

  legend: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legendLine: { width: 32, height: 4, borderRadius: 2 },

  searchCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gpsText: { color: '#0284c7', fontWeight: '700', fontSize: 12 },
  fieldGroup: { gap: 4 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#0f172a',
  },
  findButton: {
    height: 54,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  findButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  pressed: { opacity: 0.8 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  // Result Panel
  resultPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.four,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.two,
  },
  resultTitle: { fontSize: 16, color: '#0f172a' },
  savedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  savedText: { color: '#15803d', fontWeight: '800', fontSize: 13 },

  // ETA Boxes
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  etaBox: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
  },
  etaRed: { backgroundColor: '#fff5f5', borderColor: '#fca5a5' },
  etaGreen: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  etaLabel: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  etaLabelGreen: { color: '#16a34a', fontWeight: '700', fontSize: 12 },
  etaTime: { fontSize: 26, fontWeight: '900', color: '#dc2626' },
  etaTimeGreen: { fontSize: 26, fontWeight: '900', color: '#16a34a' },
  etaSub: { color: '#ef4444', fontSize: 12 },
  etaSubGreen: { color: '#22c55e', fontSize: 12 },
  dnaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },

  vsDivider: { alignItems: 'center' },
  vsText: { fontWeight: '900', color: '#94a3b8', fontSize: 14 },

  // Congestion Banner
  congestionBanner: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  congestionLabel: { fontWeight: '800', fontSize: 14 },

  // Reasons Section
  reasonsSection: { gap: Spacing.two },
  reasonsHeader: {
    fontWeight: '800',
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: 4,
  },
  causeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: '#fff8f8',
    borderRadius: 10,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#fde8e8',
  },
  causeIcon: { fontSize: 20 },
  causeTitle: { fontWeight: '700', fontSize: 13, color: '#7f1d1d' },
  causeDetail: { fontSize: 12, color: '#991b1b', lineHeight: 17, marginTop: 2 },

  // Logic Card
  logicCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  logicTitle: { fontWeight: '800', fontSize: 13, color: '#0369a1' },
  logicText: { color: '#0c4a6e', fontSize: 12, lineHeight: 18 },

  // View Route Details button
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: Spacing.four,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  detailsBtnArrow: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 18,
  },

  // ── Modal styles ─────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modalRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },

  // Detail reason card
  detailReasonCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: Spacing.four,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  detailReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailReasonTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0369a1',
    flex: 1,
  },
  savedChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savedChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  detailReasonBody: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 20,
    fontWeight: '500',
  },
  delayAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  delayAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
    lineHeight: 17,
  },

  // Detail route cards
  detailRouteCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: 12,
    borderWidth: 1.5,
  },
  detailCardRed: {
    backgroundColor: '#fff5f5',
    borderColor: '#fca5a5',
  },
  detailCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailRiskBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailRiskText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  detailCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  detailRouteName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
  },
  detailMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-around',
  },
  detailMetric: {
    alignItems: 'center',
    gap: 3,
  },
  detailMetricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailMetricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailSavings: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

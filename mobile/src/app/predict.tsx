import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { NAV_HEIGHT } from '@/constants/theme';
import {
  getRoadStatus,
  predictFromRoadStatus,
  type PredictionResponse,
  type RoadStatusResponse,
} from '@/services/api';

// ── Color maps ────────────────────────────────────────────────────────────────
const C_COLOR:  Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
const C_BG:     Record<string, string> = { Low: '#ecfdf5', Medium: '#fffbeb', High: '#fef2f2' };
const C_BORDER: Record<string, string> = { Low: '#a7f3d0', Medium: '#fde68a', High: '#fca5a5' };
const C_ICON:   Record<string, string> = {
  Low: 'checkmark-circle-outline',
  Medium: 'alert-circle-outline',
  High: 'warning-outline',
};
const ML_COLOR: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
const ML_BG:    Record<string, string> = { Low: '#ecfdf5', Medium: '#fffbeb', High: '#fef2f2' };

// ── Animated DNA bar ──────────────────────────────────────────────────────────
function DnaBar({ score, color }: { score: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1100, useNativeDriver: false }).start();
  }, [score]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const p = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(p, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.pulseDot, { backgroundColor: color, transform: [{ scale: p }] }]} />;
}

// ── Speed comparison ──────────────────────────────────────────────────────────
function SpeedBar({ speed, freeFlow }: { speed: number; freeFlow: number }) {
  const color = speed >= freeFlow * 0.7 ? '#10b981' : speed >= freeFlow * 0.4 ? '#f59e0b' : '#ef4444';
  const pct   = Math.min((speed / Math.max(freeFlow, 1)) * 100, 100);
  return (
    <View style={s.speedBox}>
      <View style={s.speedRowTop}>
        <Text style={[s.speedNum, { color }]}>{speed.toFixed(0)}</Text>
        <Text style={s.speedUnit}> km/h</Text>
        <Text style={s.speedSep}>/</Text>
        <Text style={s.freeFlowNum}>{freeFlow.toFixed(0)}</Text>
        <Text style={s.speedUnit}> free-flow</Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── ML Prediction Panel ───────────────────────────────────────────────────────
function MlPanel({ ml, loading }: { ml: PredictionResponse | null; loading: boolean }) {
  if (loading) {
    return (
      <View style={s.mlCard}>
        <View style={s.mlHeader}>
          <Ionicons name="hardware-chip-outline" size={18} color="#7c3aed" />
          <Text style={s.mlTitle}>Scikit-Learn ML Prediction</Text>
          <View style={s.mlBadge}><Text style={s.mlBadgeText}>sklearn</Text></View>
        </View>
        <View style={s.mlLoadRow}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={s.mlLoadText}>Running Random Forest model…</Text>
        </View>
      </View>
    );
  }
  if (!ml) return null;

  const cls   = ml.congestionClass as 'Low' | 'Medium' | 'High';
  const color = ML_COLOR[cls] ?? '#f59e0b';
  const bg    = ML_BG[cls]    ?? '#fffbeb';
  const conf  = Math.round(ml.confidence * 100);
  const confColor = conf >= 80 ? '#10b981' : conf >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <View style={s.mlCard}>
      <View style={s.mlHeader}>
        <Ionicons name="hardware-chip-outline" size={18} color="#7c3aed" />
        <Text style={s.mlTitle}>Scikit-Learn ML Prediction</Text>
        <View style={s.mlBadge}><Text style={s.mlBadgeText}>sklearn</Text></View>
      </View>

      {/* Result row */}
      <View style={s.mlResultRow}>
        <View style={[s.mlResultPill, { backgroundColor: bg }]}>
          <Ionicons
            name={cls === 'High' ? 'warning' : cls === 'Medium' ? 'alert-circle' : 'checkmark-circle'}
            size={20}
            color={color}
          />
          <Text style={[s.mlResultText, { color }]}>{cls} Congestion</Text>
        </View>

        <View style={s.mlConfBlock}>
          <Text style={[s.mlConfNum, { color: confColor }]}>{conf}%</Text>
          <Text style={s.mlConfLabel}>Confidence</Text>
        </View>
      </View>

      {/* Confidence bar */}
      <View style={s.mlConfBarTrack}>
        <View style={[s.mlConfBarFill, { width: `${conf}%` as any, backgroundColor: confColor }]} />
      </View>

      {/* Model info row */}
      <View style={s.mlInfoRow}>
        <View style={s.mlInfoChip}>
          <Ionicons name="git-branch-outline" size={12} color="#7c3aed" />
          <Text style={s.mlInfoChipText}>Random Forest Classifier</Text>
        </View>
        <View style={s.mlInfoChip}>
          <Ionicons name="layers-outline" size={12} color="#7c3aed" />
          <Text style={s.mlInfoChipText}>15-feature input</Text>
        </View>
        <View style={s.mlInfoChip}>
          <Ionicons name="checkmark-done-outline" size={12} color="#7c3aed" />
          <Text style={s.mlInfoChipText}>traffic_model.pkl</Text>
        </View>
      </View>

      <Text style={s.mlNote}>
        Model trained on Bangalore traffic dataset · Features derived from live Road DNA signals
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function RoadStatusScreen() {
  const [status,      setStatus]      = useState<RoadStatusResponse | null>(null);
  const [ml,          setMl]          = useState<PredictionResponse | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [mlLoading,   setMlLoading]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [error,       setError]       = useState<string | null>(null);
  const [searchText,  setSearchText]  = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } else {
          fetchStatusForCoords(12.9716, 77.5946);
        }
      } catch {
        fetchStatusForCoords(12.9716, 77.5946);
      }
    })();
  }, []);

  useEffect(() => { if (gpsCoords) fetchStatus(); }, [gpsCoords]);

  async function runMlPrediction(roadStatus: RoadStatusResponse) {
    setMlLoading(true);
    try {
      const result = await predictFromRoadStatus(roadStatus);
      setMl(result);
    } finally {
      setMlLoading(false);
    }
  }

  function showResult(data: RoadStatusResponse) {
    setStatus(data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    runMlPrediction(data);
  }

  async function fetchStatusForCoords(lat: number, lng: number) {
    setIsLoading(true); setError(null); setSearchText('');
    try { showResult(await getRoadStatus({ latitude: lat, longitude: lng })); }
    catch { setError('Unable to fetch road status. Please try again.'); }
    finally { setIsLoading(false); }
  }

  async function fetchStatus() {
    if (gpsCoords) { fetchStatusForCoords(gpsCoords.lat, gpsCoords.lng); return; }
    setIsLoading(true); setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        fetchStatusForCoords(loc.coords.latitude, loc.coords.longitude);
      } else {
        showResult(await getRoadStatus({ place_name: 'Bengaluru' }));
      }
    } catch { showResult(await getRoadStatus({})); }
    finally { setIsLoading(false); }
  }

  async function searchPlace(placeOverride?: string) {
    const target = placeOverride || searchText.trim();
    if (!target) return;
    setIsSearching(true); setError(null);
    try { showResult(await getRoadStatus({ place_name: target })); }
    catch { setError(`Could not find DNA score for "${target}". Try a more specific location.`); }
    finally { setIsSearching(false); }
  }

  const cColor   = status ? C_COLOR[status.congestion]  ?? '#f59e0b' : '#f59e0b';
  const cBg      = status ? C_BG[status.congestion]     ?? '#fffbeb' : '#fffbeb';
  const cBorder  = status ? C_BORDER[status.congestion] ?? '#fde68a' : '#fde68a';
  const cIconName = status ? C_ICON[status.congestion] ?? 'alert-circle-outline' : 'alert-circle-outline';
  const dna      = status?.road_dna ?? 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.headerTitleRow}>
              <Ionicons name="speedometer-outline" size={24} color="#0284c7" />
              <Text style={s.title}>Road Status</Text>
            </View>
            <Text style={s.subtitle}>Road DNA · ML Congestion Engine · Live Speed</Text>
          </View>
          {lastUpdated ? (
            <View style={s.liveBadge}>
              <PulseDot color="#10b981" />
              <Text style={s.liveText}>LIVE {lastUpdated}</Text>
            </View>
          ) : null}
        </View>

        {/* Search Card */}
        <View style={s.searchCard}>
          <View style={s.searchCardHeader}>
            <Ionicons name="search-outline" size={18} color="#0284c7" />
            <Text style={s.searchLabel}>Location Search</Text>
          </View>
          <View style={s.searchRow}>
            <View style={s.inputContainer}>
              <Ionicons name="location-outline" size={18} color="#94a3b8" style={s.inputIcon} />
              <TextInput
                style={s.searchInput}
                placeholder="Search Silk Board, Whitefield, Hyderabad…"
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={() => searchPlace()}
                returnKeyType="search"
              />
            </View>
            <Pressable style={({ pressed }) => [s.searchBtn, pressed && s.pressed]} onPress={() => searchPlace()} disabled={isSearching}>
              {isSearching ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.searchBtnText}>Go</Text>}
            </Pressable>
          </View>
          <View style={s.chipsWrapper}>
            {['Silk Board', 'Whitefield', 'Hebbal', 'Marathahalli', 'Koramangala'].map((place) => (
              <Pressable key={place} style={({ pressed }) => [s.placeChip, pressed && s.pressed]} onPress={() => { setSearchText(place); searchPlace(place); }}>
                <Ionicons name="location-sharp" size={13} color="#0284c7" />
                <Text style={s.placeChipText}>{place}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={({ pressed }) => [s.myLocBtn, pressed && s.pressed]} onPress={fetchStatus}>
            <Ionicons name="navigate-outline" size={16} color="#0284c7" />
            <Text style={s.myLocText}>Use Current GPS Location</Text>
          </Pressable>
        </View>

        {/* Loading */}
        {isLoading && !status && (
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={s.loadingTitle}>Analyzing Road DNA & Traffic Parameters…</Text>
            <Text style={s.loadingSteps}>GPS → OSM → OSRM → Weather → ML Model</Text>
          </View>
        )}

        {/* Error */}
        {error && !isLoading && !isSearching && (
          <View style={s.errorCard}>
            <Ionicons name="warning-outline" size={22} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {status && (
          <Animated.View style={{ opacity: fadeAnim, gap: Spacing.four }}>

            {/* Location Pill */}
            <View style={s.locPill}>
              <View style={s.locPillIconBg}>
                <Ionicons name="location" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.locArea}>{status.area_name}</Text>
                <Text style={s.locRoad} numberOfLines={1}>{status.road_name}</Text>
                <View style={s.roadTypeRow}>
                  <MaterialCommunityIcons name="road-variant" size={13} color="#64748b" />
                  <Text style={s.locRoadType}>{status.road_type}</Text>
                </View>
              </View>
              <View style={[s.cBadge, { backgroundColor: cBg, borderColor: cBorder }]}>
                <PulseDot color={cColor} />
                <Text style={[s.cBadgeText, { color: cColor }]}>{status.congestion}</Text>
              </View>
            </View>

            {/* DNA Hero */}
            <View style={s.dnaHero}>
              <View style={s.dnaHeroTop}>
                <View style={s.dnaHeroLeft}>
                  <View style={s.dnaIconBg}>
                    <MaterialCommunityIcons name="dna" size={26} color="#38bdf8" />
                  </View>
                  <View>
                    <Text style={s.dnaTitle}>Road DNA Score</Text>
                    <Text style={s.dnaSub}>Infrastructure & Congestion Health Index</Text>
                  </View>
                </View>
                <View style={s.dnaScoreBlock}>
                  <Text style={[s.dnaScoreNum, { color: cColor }]}>{dna}</Text>
                  <Text style={s.dnaScoreMax}>/100</Text>
                </View>
              </View>
              <DnaBar score={dna} color={cColor} />
              <View style={[s.dnaInterpret, { backgroundColor: cBg, borderColor: cBorder }]}>
                <Ionicons name={cIconName as any} size={18} color={cColor} />
                <Text style={[s.dnaInterpretText, { color: cColor }]}>
                  {status.congestion === 'High'
                    ? 'Critical Traffic Bottleneck — Significant delays'
                    : status.congestion === 'Medium'
                    ? 'Moderate Flow — Minor delays expected (5–15 min)'
                    : 'Optimal Road Health — Free-flowing traffic'}
                </Text>
              </View>
              <View style={s.timeBadge}>
                <Ionicons name="time-outline" size={14} color="#94a3b8" />
                <Text style={s.timeBadgeText}>{status.time_of_day_label}</Text>
              </View>
            </View>

            {/* ML Prediction Panel */}
            <MlPanel ml={ml} loading={mlLoading} />

            {/* Metrics Grid */}
            <View style={s.metricsRow}>
              <View style={s.metricCard}>
                <View style={s.metricHeader}>
                  <Ionicons name="speedometer-outline" size={18} color="#0284c7" />
                  <Text style={s.metricLabel}>Speed Profile</Text>
                </View>
                <SpeedBar speed={status.avg_speed_kmh} freeFlow={status.free_flow_speed_kmh} />
              </View>
              <View style={s.metricCard}>
                <View style={s.metricHeader}>
                  <Ionicons name="partly-sunny-outline" size={18} color="#0284c7" />
                  <Text style={s.metricLabel}>Weather</Text>
                </View>
                <Text style={s.metricValue}>{status.weather_condition}</Text>
                {status.temperature_c != null && <Text style={s.metricSub}>{Math.round(status.temperature_c)}°C</Text>}
                {status.humidity != null && <Text style={s.metricSub}>{status.humidity}% RH</Text>}
              </View>
              <View style={s.metricCard}>
                <View style={s.metricHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0284c7" />
                  <Text style={s.metricLabel}>Confidence</Text>
                </View>
                <Text style={[s.metricValue, { color: '#0284c7' }]}>{Math.round(status.confidence * 100)}%</Text>
                <Text style={s.metricSub}>Multi-signal</Text>
              </View>
            </View>

            {/* Congestion Reason */}
            <View style={s.reasonCard}>
              <View style={s.reasonHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="analytics-outline" size={18} color="#0f172a" />
                  <Text style={s.reasonTitle}>AI Congestion Analysis</Text>
                </View>
                <Text style={s.reasonTag}>Road DNA Engine</Text>
              </View>
              <Text style={s.reasonBody}>{status.congestion_reason}</Text>
            </View>

            {/* Pipeline Stepper */}
            <View style={s.pipelineCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="git-network-outline" size={18} color="#0f172a" />
                <Text style={s.pipelineTitle}>Live Signal Pipeline</Text>
              </View>
              <View style={s.pipelineSteps}>
                {[
                  { icon: 'location-outline',   label: 'GPS / Nominatim Geocode',  value: status.area_name },
                  { icon: 'map-outline',         label: 'OSM Overpass Road Type',   value: status.road_type },
                  { icon: 'speedometer-outline', label: 'OSRM Speed Profile',       value: `${status.avg_speed_kmh.toFixed(1)} km/h (free-flow: ${status.free_flow_speed_kmh} km/h)` },
                  { icon: 'time-outline',        label: 'Time-of-day Heuristics',   value: status.time_of_day_label },
                  { icon: 'pulse-outline',       label: 'Road DNA Score Computed',  value: `${dna}/100 → ${status.congestion}` },
                  { icon: 'hardware-chip-outline', label: 'sklearn ML Prediction',  value: ml ? `${ml.congestionClass} (${Math.round(ml.confidence * 100)}% conf)` : mlLoading ? 'Running…' : 'Pending' },
                ].map((step, i) => (
                  <View key={i}>
                    <View style={s.pipelineStep}>
                      <Ionicons name={step.icon as any} size={16} color={i === 5 ? '#7c3aed' : '#0284c7'} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.pipeStepLabel}>{step.label}</Text>
                        <Text style={[s.pipeStepValue, i === 5 && { color: '#7c3aed' }]}>{step.value}</Text>
                      </View>
                    </View>
                    {i < 5 && <View style={s.pipeLine} />}
                  </View>
                ))}
              </View>
              <View style={s.sourceChipsRow}>
                {status.data_sources.map((src, i) => (
                  <View key={i} style={s.sourceChip}>
                    <Ionicons name="checkmark-sharp" size={11} color="#0284c7" />
                    <Text style={s.sourceChipText}>{src}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Refresh */}
            <Pressable style={({ pressed }) => [s.refreshBtn, pressed && s.pressed]} onPress={fetchStatus} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={s.refreshBtnText}>Refresh Road Status</Text>
                </View>
              )}
            </Pressable>

          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: NAV_HEIGHT },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: 120,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center' as const,
  },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:     { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle:  { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#a7f3d0' },
  liveText:  { fontSize: 11, color: '#059669', fontWeight: '800', letterSpacing: 0.5 },
  pulseDot:  { width: 8, height: 8, borderRadius: 4 },

  searchCard:       { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.four, gap: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  searchCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchLabel:      { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  searchRow:        { flexDirection: 'row', gap: 8 },
  inputContainer:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 12 },
  inputIcon:        { marginRight: 6 },
  searchInput:      { flex: 1, paddingVertical: 11, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  searchBtn:        { backgroundColor: '#0284c7', paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center', alignItems: 'center', minWidth: 52 },
  searchBtnText:    { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  chipsWrapper:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  placeChip:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#bae6fd' },
  placeChipText:    { fontSize: 12, color: '#0369a1', fontWeight: '700' },
  myLocBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#bae6fd', marginTop: 2 },
  myLocText:        { color: '#0284c7', fontWeight: '800', fontSize: 13 },

  loadingCard:  { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.five, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e0f2fe' },
  loadingTitle: { fontSize: 15, color: '#0f172a', fontWeight: '800', textAlign: 'center' },
  loadingSteps: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderRadius: 16, padding: Spacing.four, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '600' },

  locPill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, padding: Spacing.three, gap: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  locPillIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  locArea:       { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  locRoad:       { fontSize: 12, color: '#64748b', fontWeight: '600' },
  roadTypeRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locRoadType:   { fontSize: 11, color: '#64748b', fontWeight: '600' },
  cBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  cBadgeText:    { fontWeight: '800', fontSize: 13 },

  dnaHero:        { backgroundColor: '#0f172a', borderRadius: 24, padding: Spacing.five, gap: 14, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  dnaHeroTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dnaHeroLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dnaIconBg:      { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  dnaTitle:       { fontSize: 16, fontWeight: '900', color: '#f8fafc' },
  dnaSub:         { fontSize: 11, color: '#64748b', marginTop: 2 },
  dnaScoreBlock:  { alignItems: 'flex-end' },
  dnaScoreNum:    { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  dnaScoreMax:    { fontSize: 13, color: '#475569', fontWeight: '700', textAlign: 'right' },
  barTrack:       { height: 10, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 6 },
  dnaInterpret:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  dnaInterpretText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  timeBadge:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  timeBadgeText:  { fontSize: 12, color: '#94a3b8', fontWeight: '700' },

  // ML Panel
  mlCard: { backgroundColor: '#faf5ff', borderRadius: 20, padding: Spacing.four, gap: 12, borderWidth: 1.5, borderColor: '#ddd6fe', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  mlHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mlTitle:  { fontSize: 14, fontWeight: '900', color: '#4c1d95', flex: 1 },
  mlBadge:  { backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mlBadgeText: { fontSize: 11, fontWeight: '800', color: '#7c3aed' },
  mlLoadRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mlLoadText:  { fontSize: 13, color: '#7c3aed', fontWeight: '600' },
  mlResultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mlResultPill:{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, padding: 10, borderRadius: 12 },
  mlResultText:{ fontSize: 16, fontWeight: '900' },
  mlConfBlock: { alignItems: 'center', minWidth: 56 },
  mlConfNum:   { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  mlConfLabel: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  mlConfBarTrack: { height: 7, backgroundColor: '#ede9fe', borderRadius: 4, overflow: 'hidden' },
  mlConfBarFill:  { height: '100%', borderRadius: 4 },
  mlInfoRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mlInfoChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  mlInfoChipText: { fontSize: 11, color: '#7c3aed', fontWeight: '700' },
  mlNote:      { fontSize: 11, color: '#7c3aed', fontWeight: '500', opacity: 0.8 },

  metricsRow:  { flexDirection: 'row', gap: Spacing.three },
  metricCard:  { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, padding: Spacing.three, gap: 6, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  metricHeader:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabel: { fontSize: 10, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 16, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  metricSub:   { fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: '500' },

  speedBox:    { width: '100%', gap: 4 },
  speedRowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap' },
  speedNum:    { fontSize: 20, fontWeight: '900' },
  speedUnit:   { fontSize: 10, color: '#94a3b8' },
  speedSep:    { fontSize: 14, color: '#cbd5e1', marginHorizontal: 2 },
  freeFlowNum: { fontSize: 14, fontWeight: '700', color: '#475569' },

  reasonCard:   { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.four, gap: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  reasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reasonTitle:  { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  reasonTag:    { fontSize: 10, color: '#0284c7', fontWeight: '800', backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reasonBody:   { fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '500' },

  pipelineCard:  { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.four, gap: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  pipelineTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  pipelineSteps: { gap: 0 },
  pipelineStep:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  pipeLine:      { width: 2, height: 12, backgroundColor: '#e2e8f0', marginLeft: 7 },
  pipeStepLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  pipeStepValue: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
  sourceChipsRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sourceChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0f9ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#bae6fd' },
  sourceChipText:{ fontSize: 11, color: '#0284c7', fontWeight: '700' },

  refreshBtn:     { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  refreshBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});

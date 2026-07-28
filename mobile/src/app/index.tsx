import { useState, useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { NAV_HEIGHT } from '@/constants/theme';
import { useHomeMap } from '@/hooks/use-home-map';
import { getLiveWeather, fetchAlerts, getRoadStatus, predictFromRoadStatus, type AlertItem } from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const homeMap = useHomeMap();
  const [targetCorridor] = useState('Marathahalli Corridor');
  const [userRealCity, setUserRealCity] = useState<string | null>(null);
  const [temperature, setTemperature] = useState('28°C');
  const [weatherDesc, setWeatherDesc] = useState('Light Rain');
  const [congestionLevel, setCongestionLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [roadDnaScore, setRoadDnaScore] = useState(67);
  const [mlCongestion, setMlCongestion] = useState<string | null>(null);
  const [mlConfidence, setMlConfidence] = useState<number | null>(null);
  const [latestAlert, setLatestAlert] = useState<string | null>(null);
  const [isLiveLoaded, setIsLiveLoaded] = useState(false);
  const dnaAnim = useRef(new Animated.Value(0)).current;

  function animateDna(score: number) {
    Animated.timing(dnaAnim, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }

  useEffect(() => {
    async function loadData() {
      try {
        // Geocode real city — use Location.reverseGeocodeAsync only on native
        // (removed from Expo web / SDK 49+). On web we just show a Bangalore label.
        if (homeMap.currentLocation) {
          try {
            // reverseGeocodeAsync is available on native (iOS/Android) only
            if (typeof navigator !== 'undefined' && navigator.product !== 'ReactNative') {
              // Web: skip geocode, use static label
              setUserRealCity('Bengaluru');
            } else {
              const geo = await Location.reverseGeocodeAsync(homeMap.currentLocation);
              const place = geo[0];
              const city = place?.city || place?.district || place?.subregion || place?.name;
              if (city) setUserRealCity(city);
            }
          } catch { setUserRealCity('Bengaluru'); }
        }

        // Live weather for Bangalore
        const weather = await getLiveWeather({ city: 'Bengaluru' });
        if (weather?.temperature) {
          setTemperature(`${Math.round(weather.temperature)}°C`);
          if (weather.conditions?.[0]) {
            setWeatherDesc(weather.conditions[0].description || weather.conditions[0].main);
          }
        }

        // Live Road DNA from backend (real computation, not hardcoded)
        const roadStatus = await getRoadStatus({ latitude: 12.9562, longitude: 77.7011 });
        setRoadDnaScore(roadStatus.road_dna);
        setCongestionLevel(roadStatus.congestion as 'Low' | 'Medium' | 'High');
        animateDna(roadStatus.road_dna);
        setIsLiveLoaded(true);

        // ML Model prediction derived from live road status
        const mlResult = await predictFromRoadStatus(roadStatus, 'Marathahalli Corridor');
        setMlCongestion(mlResult.congestionClass);
        setMlConfidence(Math.round(mlResult.confidence * 100));

        // Alert ticker
        const alertsList = await fetchAlerts();
        if (alertsList?.length > 0) setLatestAlert(alertsList[0].title);
      } catch (err) {
        console.log('Home dashboard init error:', err);
      }
    }
    loadData();
  }, [homeMap.currentLocation]);

  const dnaBarWidth = dnaAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const dnaColor    = roadDnaScore > 70 ? '#ef4444' : roadDnaScore > 45 ? '#f59e0b' : '#10b981';
  const congBgColor = congestionLevel === 'High' ? '#dc2626' : congestionLevel === 'Medium' ? '#d97706' : '#059669';
  const mlBgColor   = mlCongestion === 'High' ? '#7c3aed' : mlCongestion === 'Medium' ? '#2563eb' : '#059669';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile and Header Greeting */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.greeting}>
              GOOD EVENING 👋
            </ThemedText>
            <ThemedText type="title" style={styles.locationTitle}>
              📍 {targetCorridor}
            </ThemedText>
            {userRealCity && userRealCity.toLowerCase() !== 'bengaluru' ? (
              <View style={styles.gpsBadge}>
                <ThemedText type="small" style={styles.gpsText}>
                  🌐 Real GPS: {userRealCity} (Simulating Bangalore)
                </ThemedText>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.profileBadge, pressed && styles.pressed]}
          >
            <ThemedText style={styles.profileText}>JD</ThemedText>
          </Pressable>
        </View>

        {/* Live Weather & Road DNA Hero Card */}
        <View style={styles.statusHeroCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIndicator}>
              <View style={styles.pulseDot} />
              <ThemedText type="smallBold" style={styles.liveLabel}>
                LIVE CORE ENGINE
              </ThemedText>
            </View>
            <ThemedText type="small" style={styles.timestamp}>
              Updated just now
            </ThemedText>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText type="smallBold" style={styles.metricLabel}>
                ☁️ Bangalore Weather
              </ThemedText>
              <ThemedText style={styles.metricValue}>
                {temperature} · {weatherDesc}
              </ThemedText>
            </View>

            <View style={styles.metricItem}>
              <ThemedText type="smallBold" style={styles.metricLabel}>
                🚦 Road DNA Congestion
              </ThemedText>
              <View style={[styles.congestionTag, { backgroundColor: congBgColor }]}>
                <ThemedText style={styles.congestionText}>
                  {congestionLevel} Traffic
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Road DNA Score Bar — animated, live from backend */}
          <View style={styles.roadDnaSection}>
            <View style={styles.dnaHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText style={styles.dnaIcon}>🧬</ThemedText>
                <ThemedText type="smallBold" style={styles.dnaTitle}>
                  Dynamic Road DNA Score
                </ThemedText>
              </View>
              <ThemedText style={styles.dnaScoreText}>
                {roadDnaScore} <ThemedText style={styles.dnaMax}>/ 100</ThemedText>
              </ThemedText>
            </View>
            <View style={styles.dnaBarTrack}>
              <Animated.View style={[styles.dnaBarFill, { width: dnaBarWidth, backgroundColor: dnaColor }]} />
            </View>
            <ThemedText type="small" style={styles.dnaSubtext}>
              {isLiveLoaded
                ? '✓ Live from /api/v1/road-status · Marathahalli Corridor'
                : 'Connecting to Road DNA engine…'}
            </ThemedText>
          </View>

          {/* ML Model Badge */}
          {mlCongestion && (
            <View style={styles.mlBadgeRow}>
              <View style={[styles.mlTag, { backgroundColor: mlBgColor }]}>
                <ThemedText style={styles.mlTagText}>
                  🤖 sklearn ML: {mlCongestion} · {mlConfidence}% conf
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.mlTagSub}>
                Random Forest · traffic_model.pkl
              </ThemedText>
            </View>
          )}
        </View>

        {/* Live Alerts Marquee Ticker */}
        {latestAlert ? (
          <Pressable
            onPress={() => router.push('/alerts')}
            style={({ pressed }) => [styles.tickerContainer, pressed && styles.pressed]}
          >
            <ThemedText style={styles.tickerBadge}>ALERT</ThemedText>
            <ThemedText style={styles.tickerText} numberOfLines={1}>
              {latestAlert}
            </ThemedText>
            <ThemedText style={styles.tickerArrow}>➔</ThemedText>
          </Pressable>
        ) : null}

        {/* Quick Action Navigation Grid */}
        <View style={styles.quickNavSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>

          <View style={styles.gridContainer}>
            <Pressable
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
              onPress={() => router.push('/map')}
            >
              <View style={[styles.tileIconBg, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="map" size={22} color="#0284c7" />
              </View>
              <ThemedText type="smallBold" style={styles.tileLabelText}>Navigate</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tileSubtext}>
                A* Route Optimizer & Map
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
              onPress={() => router.push('/predict')}
            >
              <View style={[styles.tileIconBg, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="speedometer" size={22} color="#d97706" />
              </View>
              <ThemedText type="smallBold" style={styles.tileLabelText}>Road Status</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tileSubtext}>
                Road DNA & Health Index
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
              onPress={() => router.push('/detect')}
            >
              <View style={[styles.tileIconBg, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="videocam" size={22} color="#16a34a" />
              </View>
              <ThemedText type="smallBold" style={styles.tileLabelText}>Traffic AI</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tileSubtext}>
                YOLOv8 Camera Vehicle Count
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressedTile]}
              onPress={() => router.push('/alerts')}
            >
              <View style={[styles.tileIconBg, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="notifications" size={22} color="#dc2626" />
              </View>
              <ThemedText type="smallBold" style={styles.tileLabelText}>Live Alerts</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tileSubtext}>
                Rain & Traffic Warnings
              </ThemedText>
            </Pressable>
          </View>

          {/* Delivery Rider Mode Specialized Banner */}
          <Pressable
            style={({ pressed }) => [styles.deliveryBanner, pressed && styles.pressedTile]}
            onPress={() => router.push('/delivery')}
          >
            <View style={styles.deliveryBannerLeft}>
              <ThemedText style={{ fontSize: 28 }}>🚴</ThemedText>
              <View>
                <ThemedText type="smallBold" style={{ color: '#0369a1' }}>
                  Delivery Partner Mode
                </ThemedText>
                <ThemedText type="small" style={{ color: '#0284c7' }}>
                  Optimize SLAs & save 14+ mins per trip
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.deliveryBannerArrow}>➔</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: NAV_HEIGHT,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center' as const,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  greeting: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: '#64748b',
  },
  locationTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  gpsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: Spacing.one,
  },
  gpsText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  profileText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  statusHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.four,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: Spacing.three,
  },
  headerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveLabel: {
    color: '#38bdf8',
    letterSpacing: 1,
    fontSize: 12,
  },
  timestamp: {
    color: '#64748b',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  metricItem: {
    flex: 1,
    gap: Spacing.one,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  congestionTag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  congestionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  roadDnaSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dnaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dnaIcon: {
    fontSize: 18,
  },
  dnaTitle: {
    color: '#f8fafc',
    fontSize: 13,
  },
  dnaScoreText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 22,
  },
  dnaMax: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  dnaBarTrack: {
    height: 10,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    overflow: 'hidden',
  },
  dnaBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  dnaSubtext: {
    color: '#64748b',
    fontSize: 11,
  },
  mlBadgeRow: {
    gap: 4,
    marginTop: 4,
  },
  mlTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  mlTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  mlTagSub: {
    color: '#475569',
    fontSize: 11,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
  },
  tickerBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tickerText: {
    flex: 1,
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 13,
  },
  tickerArrow: {
    color: '#ef4444',
    fontWeight: '900',
  },
  quickNavSection: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  actionTile: {
    width: '47.5%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressedTile: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tileIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileIcon: {
    fontSize: 22,
  },
  tileLabelText: {
    color: '#0f172a',
    fontSize: 14,
  },
  tileSubtext: {
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  deliveryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  deliveryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  deliveryBannerArrow: {
    color: '#0284c7',
    fontWeight: '900',
    fontSize: 18,
  },
});

import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { calculateRoute, type RouteResponse } from '@/services/api';

export default function DeliveryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deliveryRoute, setDeliveryRoute] = useState<RouteResponse | null>(null);
  const [activeOrder] = useState({
    id: '#DEL-9824',
    merchant: 'Swiggy Instamart - Indiranagar Pod',
    items: 'Grocery delivery (6 items)',
    customer: 'Koramangala 4th Block, Bengaluru',
    sla: '30 min SLA',
  });

  useEffect(() => {
    async function loadDeliveryRoute() {
      try {
        setLoading(true);
        // Calculate route from Indiranagar pod to Koramangala customer
        const res = await calculateRoute('Indiranagar Pod, Bengaluru', 'Koramangala 4th Block, Bengaluru');
        setDeliveryRoute(res);
      } catch {
        // Fallback handled by api service
      } finally {
        setLoading(false);
      }
    }
    loadDeliveryRoute();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rider Header */}
        <View style={styles.header}>
          <View style={styles.riderRow}>
            <ThemedText style={styles.riderIcon}>🚴</ThemedText>
            <View>
              <ThemedText type="smallBold" themeColor="textSecondary">
                RIDER DASHBOARD
              </ThemedText>
              <ThemedText type="subtitle" style={styles.riderName}>
                Welcome back, Ramesh
              </ThemedText>
            </View>
          </View>

          <View style={styles.onlineChip}>
            <View style={styles.onlineDot} />
            <ThemedText style={styles.onlineText}>ONLINE</ThemedText>
          </View>
        </View>

        {/* Active Order Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <ThemedText type="smallBold" style={{ color: '#0284c7' }}>
                ACTIVE ORDER {activeOrder.id}
              </ThemedText>
              <ThemedText type="small" style={{ color: '#64748b' }}>
                {activeOrder.merchant}
              </ThemedText>
            </View>
            <View style={styles.slaBadge}>
              <ThemedText style={styles.slaText}>{activeOrder.sla}</ThemedText>
            </View>
          </View>

          <View style={styles.addressLine}>
            <ThemedText type="smallBold" style={styles.bullet}>🟢 From:</ThemedText>
            <ThemedText type="small" style={styles.addressText}>{activeOrder.merchant}</ThemedText>
          </View>

          <View style={styles.addressLine}>
            <ThemedText type="smallBold" style={styles.bullet}>🔴 To:</ThemedText>
            <ThemedText type="small" style={styles.addressText}>{activeOrder.customer}</ThemedText>
          </View>
        </View>

        {/* Route Optimization Analytics */}
        {loading ? (
          <ActivityIndicator size="large" color={'#0284c7'} style={{ marginTop: 20 }} />
        ) : deliveryRoute ? (
          <View style={styles.optimizedCard}>
            <View style={styles.optHeader}>
              <ThemedText type="smallBold" style={styles.optTitle}>
                ⚡ PRAVAHA A* ROUTE OPTIMIZER
              </ThemedText>
              <View style={styles.timeSavedChip}>
                <ThemedText style={styles.timeSavedText}>
                  🚀 {deliveryRoute.time_saved}
                </ThemedText>
              </View>
            </View>

            <View style={styles.comparisonGrid}>
              <View style={styles.compBox}>
                <ThemedText type="small" style={styles.compLabel}>
                  Standard Route
                </ThemedText>
                <ThemedText style={styles.compEtaRed}>
                  {deliveryRoute.current_route.eta}
                </ThemedText>
                <ThemedText type="small" style={{ color: '#ef4444' }}>
                  Road DNA: {deliveryRoute.current_route.road_dna}
                </ThemedText>
              </View>

              <View style={styles.divider} />

              <View style={styles.compBox}>
                <ThemedText type="small" style={styles.compLabel}>
                  A* Optimized Route
                </ThemedText>
                <ThemedText style={styles.compEtaGreen}>
                  {deliveryRoute.alternative_route.eta}
                </ThemedText>
                <ThemedText type="small" style={{ color: '#22c55e' }}>
                  Road DNA: {deliveryRoute.alternative_route.road_dna}
                </ThemedText>
              </View>
            </View>

            {/* Reroute Reason Detail */}
            <View style={styles.reasonSection}>
              <ThemedText type="smallBold" style={{ color: '#0369a1' }}>
                🧠 Routing Logic:
              </ThemedText>
              <ThemedText type="small" style={styles.reasonText}>
                {deliveryRoute.reroute_reason}
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
              onPress={() => router.push('/map')}
            >
              <ThemedText style={styles.navButtonText}>
                🏍️ Start Delivery Navigation
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Rider Tool actions */}
        <View style={styles.riderActions}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            QUICK REPORT TOOLS
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.toolTile, pressed && styles.pressed]}
            onPress={() => router.push('/detect')}
          >
            <ThemedText style={styles.toolIcon}>📸</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Report Local Bottleneck (YOLO AI)</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Take photo of local blockages to notify other riders
              </ThemedText>
            </View>
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
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: Spacing.three,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  riderIcon: {
    fontSize: 28,
  },
  riderName: {
    color: '#0f172a',
    fontWeight: '900',
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: 999,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#15803d',
    fontWeight: '800',
    fontSize: 11,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.two,
  },
  slaBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  slaText: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '800',
  },
  addressLine: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bullet: {
    width: 50,
  },
  addressText: {
    color: '#334155',
    flex: 1,
  },
  optimizedCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.three,
    elevation: 3,
  },
  optHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optTitle: {
    color: '#0369a1',
  },
  timeSavedChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeSavedText: {
    color: '#15803d',
    fontWeight: '800',
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  compBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  compLabel: {
    color: '#64748b',
  },
  compEtaRed: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ef4444',
  },
  compEtaGreen: {
    fontSize: 20,
    fontWeight: '900',
    color: '#22c55e',
  },
  divider: {
    width: 1,
    backgroundColor: '#bae6fd',
  },
  reasonSection: {
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  reasonText: {
    color: '#475569',
    lineHeight: 18,
    marginTop: 2,
  },
  navButton: {
    height: 48,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
  riderActions: {
    gap: Spacing.two,
  },
  toolTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolIcon: {
    fontSize: 24,
  },
});

import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { fetchAlerts, type AlertItem } from '@/services/api';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestLiveAlert, setLatestLiveAlert] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      const data = await fetchAlerts();
      setAlerts(data);
    }
    loadAlerts();

    // Auto-refresh alerts every 10 seconds dynamically
    const interval = setInterval(loadAlerts, 10000);

    // WebSocket real-time live alert stream connection
    let ws: WebSocket | null = null;
    try {
      const wsUrl = process.env.EXPO_PUBLIC_API_BASE_URL
        ? process.env.EXPO_PUBLIC_API_BASE_URL.replace('http', 'ws') + '/ws/updates'
        : 'ws://10.0.2.2:8000/ws/updates';

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'alert') {
            const newAlertItem: AlertItem = {
              id: `ws-${Date.now()}`,
              title: message.title,
              location: message.location,
              type: message.id.includes('movie') ? 'movie' : 'cricket',
              detail: message.detail,
              timestamp: 'Just now (Live WS)',
            };

            setAlerts((prev) => [newAlertItem, ...prev.filter((item) => item.id !== newAlertItem.id)]);
            setLatestLiveAlert(message.title);
          }
        } catch (e) {
          // Parse error ignore
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle">🔔 Dynamic Traffic Alerts</ThemedText>
            <View style={[styles.statusTag, { backgroundColor: isConnected ? '#22c55e' : '#eab308' }]}>
              <ThemedText style={styles.statusText}>
                {isConnected ? '🟢 LIVE WEBSOCKET' : '🟡 LIVE POLLING'}
              </ThemedText>
            </View>
          </View>

          <ThemedText themeColor="textSecondary" type="small">
            Real-time streaming alerts for IPL Cricket Matches, heavy rain & congestion spikes
          </ThemedText>
        </View>

        {/* Live Banner for latest alert */}
        {latestLiveAlert ? (
          <View style={styles.liveBanner}>
            <ThemedText style={styles.liveBannerTitle}>🔴 LIVE INCOMING ALERT</ThemedText>
            <ThemedText style={styles.liveBannerText}>{latestLiveAlert}</ThemedText>
          </View>
        ) : null}

        {/* Alerts Feed */}
        <View style={styles.feed}>
          {alerts.map((item) => (
            <View key={item.id} style={styles.alertCard}>
              <View style={styles.cardTop}>
                <View style={styles.badgeRow}>
                  <ThemedText style={styles.typeIcon}>
                    {item.type === 'movie'
                      ? '🎬'
                      : item.type === 'cricket'
                      ? '🏏'
                      : item.type === 'rain'
                      ? '🌧️'
                      : item.type === 'congestion'
                      ? '🚨'
                      : '🚧'}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.titleText}>
                    {item.title}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={styles.timeText}>
                  {item.timestamp}
                </ThemedText>
              </View>

              <ThemedText style={styles.locationTag}>
                📍 {item.location}
              </ThemedText>

              <ThemedText type="small" style={styles.detailText}>
                {item.detail}
              </ThemedText>
            </View>
          ))}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  liveBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: 4,
  },
  liveBannerTitle: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: 12,
  },
  liveBannerText: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 14,
  },
  feed: {
    gap: Spacing.three,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  typeIcon: {
    fontSize: 20,
  },
  titleText: {
    fontSize: 15,
    color: '#0f172a',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  locationTag: {
    color: '#0284c7',
    fontWeight: '700',
  },
  detailText: {
    color: '#475569',
    lineHeight: 20,
  },
});

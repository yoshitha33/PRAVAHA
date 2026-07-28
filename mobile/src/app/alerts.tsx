import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { NAV_HEIGHT } from '@/constants/theme';
import { fetchAlerts, fetchSocialIntel, getWsBaseUrl, type AlertItem, type SocialReport } from '@/services/api';

// ─── Alert type config ────────────────────────────────────────────────────────
const ALERT_CFG: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
  rain:         { icon: 'rainy-outline',        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', label: 'Rain' },
  congestion:   { icon: 'warning-outline',      color: '#b91c1c', bg: '#fff1f2', border: '#fca5a5', label: 'Congestion' },
  construction: { icon: 'construct-outline',    color: '#92400e', bg: '#fffbeb', border: '#fde68a', label: 'Construction' },
  accident:     { icon: 'medkit-outline',       color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', label: 'Accident' },
  cricket:      { icon: 'trophy-outline',       color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', label: 'Cricket' },
  movie:        { icon: 'film-outline',         color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Cinema' },
  weather:      { icon: 'partly-sunny-outline', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Weather' },
};
const DEFAULT_CFG = { icon: 'alert-circle-outline', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: 'Alert' };

// Social category config
const SOC_CFG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  accident:       { icon: 'medkit-outline',    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  waterlogging:   { icon: 'water-outline',     color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  congestion:     { icon: 'car-outline',       color: '#b91c1c', bg: '#fff1f2', border: '#fca5a5' },
  protest:        { icon: 'megaphone-outline', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  tree_fall:      { icon: 'leaf-outline',      color: '#15803d', bg: '#f0fdf4', border: '#a7f3d0' },
  construction:   { icon: 'construct-outline', color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  stadium_traffic:{ icon: 'trophy-outline',    color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  clear:          { icon: 'checkmark-circle-outline', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};
const SOC_DEFAULT = { icon: 'alert-circle-outline', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

// ─── Animated alert card (Live Alerts tab) ───────────────────────────────────
function AlertCard({ item, index }: { item: AlertItem; index: number }) {
  const slide = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = ALERT_CFG[item.type ?? ''] ?? DEFAULT_CFG;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide,   { toValue: 0, duration: 340, delay: index * 55, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 340, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.card, { borderLeftColor: cfg.color, transform: [{ translateY: slide }], opacity }]}>
      <View style={s.cardTop}>
        <View style={[s.iconBubble, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={s.cardTitleBlock}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={s.cardTime}>{item.timestamp}</Text>
        </View>
        <View style={[s.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[s.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={s.locationRow}>
        <Ionicons name="location-sharp" size={13} color="#0284c7" />
        <Text style={s.locationText}>{item.location}</Text>
      </View>
      <Text style={s.detailText}>{item.detail}</Text>
      <View style={[s.impactBar, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Ionicons name="pulse-outline" size={13} color={cfg.color} />
        <Text style={[s.impactText, { color: cfg.color }]}>
          Road DNA Impact —{' '}
          {cfg.color === '#b91c1c' || cfg.color === '#991b1b'
            ? 'High severity — consider alternate route'
            : cfg.color === '#92400e' || cfg.color === '#0369a1'
            ? 'Moderate severity — expect delays'
            : 'Low severity — monitor situation'}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Tweet-style social intel card ───────────────────────────────────────────
function SocialCard({ report, index }: { report: SocialReport; index: number }) {
  const slide = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = SOC_CFG[report.category] ?? SOC_DEFAULT;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide,   { toValue: 0, duration: 340, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 340, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const sevColor = report.severity_color;
  const dnaPositive = report.dna_impact > 0;

  return (
    <Animated.View style={[s.tweetCard, { transform: [{ translateY: slide }], opacity }]}>
      {/* Tweet header */}
      <View style={s.tweetHeader}>
        <View style={[s.tweetAvatar, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
        </View>
        <View style={s.tweetMeta}>
          <View style={s.tweetNameRow}>
            <Text style={s.tweetDisplayName}>{report.display_name}</Text>
            {report.verified_by_ai && (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#0284c7" />
                <Text style={s.verifiedText}>AI Verified</Text>
              </View>
            )}
          </View>
          <Text style={s.tweetHandle}>{report.handle} · {report.posted_at}</Text>
        </View>
        {/* Severity pill */}
        <View style={[s.severityPill, { backgroundColor: sevColor + '20', borderColor: sevColor }]}>
          <Text style={[s.severityText, { color: sevColor }]}>{report.severity}</Text>
        </View>
      </View>

      {/* Tweet text */}
      <Text style={s.tweetText}>{report.text}</Text>

      {/* Location chip */}
      <View style={s.tweetLocationRow}>
        <Ionicons name="location-sharp" size={12} color="#0284c7" />
        <Text style={s.tweetLocation}>{report.location}</Text>
      </View>

      {/* Metrics row */}
      <View style={s.tweetMetrics}>
        <View style={s.tweetMetric}>
          <Ionicons name="heart-outline" size={14} color="#94a3b8" />
          <Text style={s.tweetMetricText}>{report.likes.toLocaleString()}</Text>
        </View>
        <View style={s.tweetMetric}>
          <Ionicons name="repeat-outline" size={14} color="#94a3b8" />
          <Text style={s.tweetMetricText}>{report.retweets.toLocaleString()}</Text>
        </View>
        <View style={s.tweetMetric}>
          <Ionicons name="hardware-chip-outline" size={14} color="#7c3aed" />
          <Text style={[s.tweetMetricText, { color: '#7c3aed' }]}>NLP: {report.ai_classification}</Text>
        </View>
        {/* DNA impact chip */}
        <View style={[s.dnaDeltaChip, { backgroundColor: dnaPositive ? '#fef2f2' : '#f0fdf4', borderColor: dnaPositive ? '#fca5a5' : '#a7f3d0' }]}>
          <Text style={[s.dnaDeltaText, { color: dnaPositive ? '#dc2626' : '#059669' }]}>
            {dnaPositive ? `+${report.dna_impact}` : `${report.dna_impact}`} DNA
          </Text>
        </View>
      </View>

      {/* Source footer */}
      <Text style={s.tweetSource}>{report.source}</Text>
    </Animated.View>
  );
}

// ─── Live WS banner ───────────────────────────────────────────────────────────
function LiveBanner({ title }: { title: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.liveBanner, { transform: [{ scale: pulse }] }]}>
      <View style={s.liveDot} />
      <View style={{ flex: 1 }}>
        <Text style={s.liveBannerLabel}>INCOMING LIVE ALERT</Text>
        <Text style={s.liveBannerTitle} numberOfLines={2}>{title}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'social'>('alerts');
  const [alerts, setAlerts]         = useState<AlertItem[]>([]);
  const [social, setSocial]         = useState<SocialReport[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestLiveAlert, setLatestLiveAlert] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    const data = await fetchAlerts();
    setAlerts(data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const loadSocial = useCallback(async () => {
    setSocialLoading(true);
    try {
      const data = await fetchSocialIntel();
      setSocial(data);
    } finally {
      setSocialLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAlerts(), loadSocial()]);
    setRefreshing(false);
  }, [loadAlerts, loadSocial]);

  useEffect(() => {
    loadAlerts();
    loadSocial();
    const interval = setInterval(() => { loadAlerts(); loadSocial(); }, 15000);

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${getWsBaseUrl()}/ws/updates`);
      ws.onopen    = () => setIsConnected(true);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'alert') {
            const item: AlertItem = { id: `ws-${Date.now()}`, title: msg.title, location: msg.location ?? 'Bengaluru', type: msg.alertType ?? 'congestion', detail: msg.detail ?? '', timestamp: 'Just now · Live' };
            setAlerts((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
            setLatestLiveAlert(msg.title);
          }
        } catch { /* ignore */ }
      };
      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => setIsConnected(false);
    } catch { setIsConnected(false); }

    return () => { clearInterval(interval); ws?.close(); };
  }, [loadAlerts, loadSocial]);

  const highCount  = alerts.filter((a) => a.type === 'congestion' || a.type === 'accident').length;
  const critSocial = social.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
  const totalDna   = social.reduce((sum, r) => sum + Math.max(0, r.dna_impact), 0);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" colors={['#0284c7']} />}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.titleRow}>
            <Ionicons name="notifications" size={24} color="#0284c7" />
            <Text style={s.title}>Traffic Intelligence</Text>
          </View>
          <Text style={s.subtitle}>Live alerts · AI social media scan · Road DNA impact</Text>
        </View>
        <View style={[s.connBadge, { backgroundColor: isConnected ? '#ecfdf5' : '#fefce8', borderColor: isConnected ? '#a7f3d0' : '#fde68a' }]}>
          <View style={[s.connDot, { backgroundColor: isConnected ? '#10b981' : '#eab308' }]} />
          <Text style={[s.connText, { color: isConnected ? '#059669' : '#a16207' }]}>{isConnected ? 'Live WS' : 'Polling'}</Text>
        </View>
      </View>

      {/* ── Summary strip ── */}
      <View style={s.summaryStrip}>
        <View style={s.summaryItem}>
          <Ionicons name="alert-circle" size={18} color="#dc2626" />
          <Text style={s.summaryValue}>{highCount}</Text>
          <Text style={s.summaryLabel}>System Alerts</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Ionicons name="logo-twitter" size={18} color="#1d9bf0" />
          <Text style={s.summaryValue}>{critSocial}</Text>
          <Text style={s.summaryLabel}>Social Reports</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Ionicons name="pulse-outline" size={18} color="#7c3aed" />
          <Text style={s.summaryValue}>+{totalDna}</Text>
          <Text style={s.summaryLabel}>DNA Impact</Text>
        </View>
        <View style={s.summaryDivider} />
        <Pressable style={s.refreshChip} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={14} color="#0284c7" />
          <Text style={s.refreshChipText}>{lastUpdated || 'Sync'}</Text>
        </Pressable>
      </View>

      {/* ── Tab switcher ── */}
      <View style={s.tabBar}>
        <Pressable style={[s.tabBtn, activeTab === 'alerts' && s.tabBtnActive]} onPress={() => setActiveTab('alerts')}>
          <Ionicons name="notifications-outline" size={16} color={activeTab === 'alerts' ? '#0284c7' : '#94a3b8'} />
          <Text style={[s.tabBtnText, activeTab === 'alerts' && s.tabBtnTextActive]}>
            Live Alerts {alerts.length > 0 ? `(${alerts.length})` : ''}
          </Text>
        </Pressable>
        <Pressable style={[s.tabBtn, activeTab === 'social' && s.tabBtnActive]} onPress={() => setActiveTab('social')}>
          <Ionicons name="logo-twitter" size={16} color={activeTab === 'social' ? '#1d9bf0' : '#94a3b8'} />
          <Text style={[s.tabBtnText, activeTab === 'social' && { color: '#1d9bf0', fontWeight: '800' }]}>
            Social Intel {social.length > 0 ? `(${social.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* ── Live WS banner ── */}
      {latestLiveAlert && activeTab === 'alerts' && <LiveBanner title={latestLiveAlert} />}

      {/* ── Social Intel header strip ── */}
      {activeTab === 'social' && (
        <View style={s.socialHeader}>
          <Ionicons name="logo-twitter" size={20} color="#1d9bf0" />
          <View style={{ flex: 1 }}>
            <Text style={s.socialHeaderTitle}>X (Twitter) Traffic Scan · Bengaluru</Text>
            <Text style={s.socialHeaderSub}>AI keyword classification · NLP severity scoring · Road DNA impact</Text>
          </View>
          {socialLoading && <Ionicons name="sync-outline" size={16} color="#94a3b8" />}
        </View>
      )}

      <Text style={s.pullHint}>↓ Pull to refresh · Auto-syncs every 15s</Text>

      {/* ── Feed ── */}
      <View style={s.feed}>
        {activeTab === 'alerts' ? (
          alerts.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#a7f3d0" />
              <Text style={s.emptyTitle}>All Clear</Text>
              <Text style={s.emptySubtitle}>No active alerts for Bangalore right now.</Text>
            </View>
          ) : (
            alerts.map((item, i) => <AlertCard key={item.id} item={item} index={i} />)
          )
        ) : (
          social.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="logo-twitter" size={48} color="#bae6fd" />
              <Text style={s.emptyTitle}>Scanning Social Media…</Text>
              <Text style={s.emptySubtitle}>AI is monitoring X (Twitter) for Bangalore traffic reports.</Text>
            </View>
          ) : (
            social.map((r, i) => <SocialCard key={r.id} report={r} index={i} />)
          )
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f8fafc', paddingTop: NAV_HEIGHT, maxWidth: 800, alignSelf: 'center' as const, width: '100%' },
  content: { padding: Spacing.four, gap: Spacing.three, maxWidth: 800, width: '100%', alignSelf: 'center' as const },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 3 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:      { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle:   { fontSize: 11, color: '#64748b', fontWeight: '500' },
  connBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  connDot:    { width: 7, height: 7, borderRadius: 4 },
  connText:   { fontSize: 11, fontWeight: '800' },

  summaryStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: Spacing.four, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  summaryItem:  { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 15, fontWeight: '900', color: '#0f172a' },
  summaryLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  refreshChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#bae6fd' },
  refreshChipText: { fontSize: 11, fontWeight: '800', color: '#0284c7' },

  tabBar:         { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#e2e8f0', gap: 4 },
  tabBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabBtnActive:   { backgroundColor: '#f0f9ff' },
  tabBtnText:     { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  tabBtnTextActive: { color: '#0284c7', fontWeight: '800' },

  socialHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#e7f5fe', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#bae6fd' },
  socialHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#0c4a6e' },
  socialHeaderSub:   { fontSize: 11, color: '#0369a1', fontWeight: '500', marginTop: 2 },

  liveBanner:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 14, padding: Spacing.three },
  liveDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  liveBannerLabel: { fontSize: 10, fontWeight: '900', color: '#dc2626', letterSpacing: 0.8, marginBottom: 2 },
  liveBannerTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },

  pullHint: { textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: -4 },
  feed:     { gap: Spacing.three },

  // Alert cards
  card:          { backgroundColor: '#ffffff', borderRadius: 18, padding: Spacing.four, gap: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBubble:    { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardTitleBlock:{ flex: 1, gap: 3 },
  cardTitle:     { fontSize: 14, fontWeight: '800', color: '#0f172a', lineHeight: 19 },
  cardTime:      { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', flexShrink: 0 },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText:  { fontSize: 12, color: '#0284c7', fontWeight: '700', flex: 1 },
  detailText:    { fontSize: 13, color: '#475569', lineHeight: 19, fontWeight: '500' },
  impactBar:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  impactText:    { fontSize: 11, fontWeight: '700', flex: 1 },

  // Tweet cards
  tweetCard:       { backgroundColor: '#ffffff', borderRadius: 18, padding: Spacing.four, gap: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tweetHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tweetAvatar:     { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, flexShrink: 0 },
  tweetMeta:       { flex: 1, gap: 2 },
  tweetNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tweetDisplayName:{ fontSize: 13, fontWeight: '900', color: '#0f172a' },
  verifiedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText:    { fontSize: 10, fontWeight: '800', color: '#0284c7' },
  tweetHandle:     { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  severityPill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', flexShrink: 0 },
  severityText:    { fontSize: 11, fontWeight: '900' },
  tweetText:       { fontSize: 14, color: '#0f172a', lineHeight: 21, fontWeight: '500' },
  tweetLocationRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  tweetLocation:   { fontSize: 12, color: '#0284c7', fontWeight: '700' },
  tweetMetrics:    { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  tweetMetric:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tweetMetricText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  dnaDeltaChip:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginLeft: 'auto' },
  dnaDeltaText:    { fontSize: 11, fontWeight: '900' },
  tweetSource:     { fontSize: 10, color: '#cbd5e1', fontWeight: '500' },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle:    { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center' },
});

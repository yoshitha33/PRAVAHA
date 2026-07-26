import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { runYoloDetection, type DetectionResponse } from '@/services/api';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY: Record<
  'Low' | 'Medium' | 'High',
  { label: string; color: string; bg: string; border: string; icon: string; desc: string }
> = {
  Low: {
    label: 'Low',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: 'checkmark-circle-outline',
    desc: 'Road is clear — free-flowing traffic conditions.',
  },
  Medium: {
    label: 'Medium',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: 'alert-circle-outline',
    desc: 'Moderate congestion — minor delays expected.',
  },
  High: {
    label: 'High',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    icon: 'warning-outline',
    desc: 'Heavy traffic — significant delays ahead.',
  },
};

// ─── Animated bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const ran = useRef(false);
  if (!ran.current) {
    ran.current = true;
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// ─── Vehicle row ──────────────────────────────────────────────────────────────
function VehicleRow({
  emoji,
  label,
  count,
  total,
  color,
}: {
  emoji: string;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={s.vehicleRow}>
      <Text style={s.vehicleEmoji}>{emoji}</Text>
      <View style={s.vehicleInfo}>
        <View style={s.vehicleLabelRow}>
          <Text style={s.vehicleLabel}>{label}</Text>
          <Text style={[s.vehicleCount, { color }]}>{count}</Text>
        </View>
        <AnimatedBar pct={pct} color={color} />
        <Text style={s.vehiclePct}>{pct}% of total</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TrafficDetectionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);

  // ── Shared upload handler ────────────────────────────────────────────────
  async function uploadAndDetect(uri: string, mimeType: string, filename: string) {
    setImageUri(uri);
    setResult(null);
    setErrorMsg(null);
    setInferenceMs(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: mimeType } as any);

      const t0 = Date.now();
      const res = await runYoloDetection(formData);
      const elapsed = Date.now() - t0;

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setResult(res.data);
        setInferenceMs(elapsed);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Gallery picker ───────────────────────────────────────────────────────
  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload traffic images.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const ext = mime.split('/')[1] ?? 'jpg';
      await uploadAndDetect(asset.uri, mime, `traffic.${ext}`);
    }
  }

  // ── Camera picker ────────────────────────────────────────────────────────
  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture traffic images.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const ext = mime.split('/')[1] ?? 'jpg';
      await uploadAndDetect(asset.uri, mime, `traffic.${ext}`);
    }
  }

  function reset() {
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
    setInferenceMs(null);
  }

  const severity = result ? SEVERITY[result.traffic_density] : null;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <Ionicons name="eye-outline" size={26} color="#0284c7" />
          <Text style={s.title}>Traffic Detection</Text>
        </View>
        <Text style={s.subtitle}>
          Snap or upload a traffic photo — YOLOv8 counts every vehicle and rates severity in seconds.
        </Text>
      </View>

      {/* ── Upload card ── */}
      <View style={s.uploadCard}>
        <View style={s.uploadCardHeader}>
          <Ionicons name="cloud-upload-outline" size={18} color="#0f172a" />
          <Text style={s.uploadCardTitle}>Upload Traffic Image</Text>
        </View>

        <View style={s.uploadBtnRow}>
          {/* Camera */}
          <Pressable
            style={({ pressed }) => [s.uploadBtn, s.uploadBtnCamera, pressed && s.pressed]}
            onPress={pickFromCamera}
            disabled={loading}
          >
            <Ionicons name="camera-outline" size={22} color="#ffffff" />
            <Text style={s.uploadBtnText}>Camera</Text>
          </Pressable>

          {/* Gallery */}
          <Pressable
            style={({ pressed }) => [s.uploadBtn, s.uploadBtnGallery, pressed && s.pressed]}
            onPress={pickFromGallery}
            disabled={loading}
          >
            <Ionicons name="images-outline" size={22} color="#0284c7" />
            <Text style={[s.uploadBtnText, { color: '#0284c7' }]}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={s.uploadHint}>
          Supports JPEG · PNG · WEBP — max confidence at 640 × 640 px
        </Text>
      </View>

      {/* ── Image preview ── */}
      {imageUri ? (
        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <Text style={s.previewTitle}>Selected Image</Text>
            {!loading && (
              <Pressable onPress={reset} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={22} color="#64748b" />
              </Pressable>
            )}
          </View>
          <Image
            source={{ uri: imageUri }}
            style={s.previewImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        // Empty state placeholder
        <View style={s.emptyState}>
          <Ionicons name="image-outline" size={52} color="#cbd5e1" />
          <Text style={s.emptyStateText}>No image selected</Text>
          <Text style={s.emptyStateSub}>
            Use Camera or Gallery above to pick a traffic photo
          </Text>
        </View>
      )}

      {/* ── Loading ── */}
      {loading && (
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={s.loadingTitle}>Analyzing with YOLOv8…</Text>
          <Text style={s.loadingSteps}>
            Detecting vehicles · Counting objects · Scoring severity
          </Text>
        </View>
      )}

      {/* ── Error ── */}
      {errorMsg && !loading && (
        <View style={s.errorCard}>
          <Ionicons name="alert-circle-outline" size={22} color="#dc2626" />
          <Text style={s.errorText}>{errorMsg}</Text>
          <Pressable style={s.retryBtn} onPress={imageUri ? pickFromGallery : undefined}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {/* ── Results ── */}
      {result && !loading && severity && (
        <View style={s.resultsContainer}>

          {/* Severity hero */}
          <View style={[s.severityHero, { borderColor: severity.border, backgroundColor: severity.bg }]}>
            <View style={s.severityLeft}>
              <Ionicons name={severity.icon as any} size={32} color={severity.color} />
              <View>
                <Text style={s.severityLabel}>Traffic Severity</Text>
                <Text style={[s.severityValue, { color: severity.color }]}>
                  {severity.label}
                </Text>
              </View>
            </View>
            <View style={[s.severityBadge, { backgroundColor: severity.color }]}>
              <Text style={s.severityBadgeText}>{result.total_vehicles} vehicles</Text>
            </View>
          </View>

          <Text style={[s.severityDesc, { color: severity.color }]}>{severity.desc}</Text>

          {/* Vehicle breakdown */}
          <View style={s.breakdownCard}>
            <View style={s.breakdownHeader}>
              <Ionicons name="bar-chart-outline" size={18} color="#0f172a" />
              <Text style={s.breakdownTitle}>Vehicle Breakdown</Text>
              <View style={s.totalPill}>
                <Text style={s.totalPillText}>Total: {result.total_vehicles}</Text>
              </View>
            </View>

            <VehicleRow
              emoji="🚗"
              label="Cars"
              count={result.vehicle_counts.car}
              total={result.total_vehicles}
              color="#0284c7"
            />
            <View style={s.divider} />
            <VehicleRow
              emoji="🏍️"
              label="Motorcycles"
              count={result.vehicle_counts.motorcycle}
              total={result.total_vehicles}
              color="#7c3aed"
            />
            <View style={s.divider} />
            <VehicleRow
              emoji="🚌"
              label="Buses"
              count={result.vehicle_counts.bus}
              total={result.total_vehicles}
              color="#d97706"
            />
            <View style={s.divider} />
            <VehicleRow
              emoji="🚚"
              label="Trucks"
              count={result.vehicle_counts.truck}
              total={result.total_vehicles}
              color="#dc2626"
            />
          </View>

          {/* Inference metadata */}
          <View style={s.metaRow}>
            <View style={s.metaChip}>
              <Ionicons name="flash-outline" size={13} color="#0284c7" />
              <Text style={s.metaChipText}>
                {inferenceMs != null ? `${inferenceMs} ms` : '—'}
              </Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="hardware-chip-outline" size={13} color="#0284c7" />
              <Text style={s.metaChipText}>YOLOv8n · COCO</Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="image-outline" size={13} color="#0284c7" />
              <Text style={s.metaChipText}>{result.source_type}</Text>
            </View>
          </View>

          {/* Scan again */}
          <Pressable
            style={({ pressed }) => [s.scanAgainBtn, pressed && s.pressed]}
            onPress={reset}
          >
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={s.scanAgainText}>Scan Another Image</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },

  // Header
  header: { gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', lineHeight: 19 },

  // Upload card
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.four,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  uploadCardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  uploadBtnRow: { flexDirection: 'row', gap: 10 },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  uploadBtnCamera: { backgroundColor: '#0284c7' },
  uploadBtnGallery: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
  },
  uploadBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  uploadHint: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  pressed: { opacity: 0.75 },

  // Preview
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  previewImage: { width: '100%', height: 220, backgroundColor: '#0f172a' },

  // Empty state
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  emptyStateSub: { fontSize: 12, color: '#cbd5e1', textAlign: 'center', paddingHorizontal: 32 },

  // Loading
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.five,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  loadingTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  loadingSteps: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Error
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 10,
    alignItems: 'flex-start',
  },
  errorText: { fontSize: 13, color: '#991b1b', fontWeight: '600', flex: 1 },
  retryBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  retryText: { fontSize: 13, fontWeight: '800', color: '#dc2626' },

  // Results container
  resultsContainer: { gap: Spacing.three },

  // Severity hero
  severityHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: Spacing.four,
  },
  severityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 },
  severityValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  severityBadgeText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  severityDesc: { fontSize: 13, fontWeight: '600', marginTop: -6 },

  // Breakdown card
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.four,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  breakdownTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 },
  totalPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalPillText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  // Vehicle row
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  vehicleInfo: { flex: 1, gap: 4 },
  vehicleLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  vehicleCount: { fontSize: 20, fontWeight: '900' },
  vehiclePct: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  // Bar
  barTrack: {
    height: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },

  divider: { height: 1, backgroundColor: '#f1f5f9' },

  // Meta chips
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  metaChipText: { fontSize: 12, fontWeight: '700', color: '#0369a1' },

  // Scan again button
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
  },
  scanAgainText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});

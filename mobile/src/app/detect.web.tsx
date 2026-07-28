import { ChangeEvent, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import { NAV_HEIGHT } from '@/constants/theme';
import { runYoloDetection, type DetectionResponse } from '@/services/api';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY: Record<
  'Low' | 'Medium' | 'High',
  { label: string; color: string; bg: string; border: string; icon: string; desc: string }
> = {
  Low:    { label: 'Low',    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'checkmark-circle-outline', desc: 'Road is clear — free-flowing traffic conditions.' },
  Medium: { label: 'Medium', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'alert-circle-outline',     desc: 'Moderate congestion — minor delays expected.' },
  High:   { label: 'High',   color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: 'warning-outline',          desc: 'Heavy traffic — significant delays ahead.' },
};

// ─── Static bar (web) ─────────────────────────────────────────────────────────
function StaticBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Vehicle row ──────────────────────────────────────────────────────────────
function VehicleRow({ emoji, label, count, total, color }: { emoji: string; label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={s.vehicleRow}>
      <Text style={s.vehicleEmoji}>{emoji}</Text>
      <View style={s.vehicleInfo}>
        <View style={s.vehicleLabelRow}>
          <Text style={s.vehicleLabel}>{label}</Text>
          <Text style={[s.vehicleCount, { color }]}>{count}</Text>
        </View>
        <StaticBar pct={pct} color={color} />
        <Text style={s.vehiclePct}>{pct}% of total</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TrafficDetectionScreen() {
  const [fileUri,   setFileUri]   = useState<string | null>(null);
  const [isVideo,   setIsVideo]   = useState(false);
  const [fileName,  setFileName]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<DetectionResponse | null>(null);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const video     = file.type.startsWith('video/');
    setFileUri(objectUrl);
    setIsVideo(video);
    setFileName(file.name);
    setResult(null);
    setErrorMsg(null);
    setInferenceMs(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const t0  = Date.now();
      const res = await runYoloDetection(formData as any);
      const elapsed = Date.now() - t0;

      if (res.error) { setErrorMsg(res.error); }
      else           { setResult(res.data); setInferenceMs(elapsed); }
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function reset() {
    setFileUri(null);
    setIsVideo(false);
    setFileName('');
    setResult(null);
    setErrorMsg(null);
    setInferenceMs(null);
  }

  const severity = result ? SEVERITY[result.traffic_density] : null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <Ionicons name="eye-outline" size={26} color="#0284c7" />
          <Text style={s.title}>Traffic AI Detection</Text>
        </View>
        <Text style={s.subtitle}>
          Upload a traffic photo or video — YOLOv8 counts every vehicle and rates severity in seconds.
        </Text>
      </View>

      {/* ── Upload card ── */}
      <View style={s.uploadCard}>
        <View style={s.uploadCardHeader}>
          <Ionicons name="cloud-upload-outline" size={18} color="#0f172a" />
          <Text style={s.uploadCardTitle}>Upload Traffic Image or Video</Text>
        </View>

        {/* Two-button row */}
        <View style={s.btnRow}>
          {/* Image picker */}
          <label
            htmlFor="detect-image-input"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0284c7', color: '#ffffff', padding: '13px 14px', borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}
          >
            <span style={{ fontSize: 20 }}>📷</span>
            <div style={{ lineHeight: 1.3 }}>
              <div>Choose Photo</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>JPEG · PNG · WEBP</div>
            </div>
          </label>
          <input id="detect-image-input" ref={inputRef} type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            onChange={handleFileSelect} style={{ display: 'none' }} />

          {/* Video picker */}
          <label
            htmlFor="detect-video-input"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f5f3ff', color: '#7c3aed', padding: '13px 14px', borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 14, border: '1.5px solid #ddd6fe' }}
          >
            <span style={{ fontSize: 20 }}>🎥</span>
            <div style={{ lineHeight: 1.3 }}>
              <div>Choose Video</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>MP4 · MOV · AVI · MKV</div>
            </div>
          </label>
          <input id="detect-video-input" type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
            onChange={handleFileSelect} style={{ display: 'none' }} />
        </View>

        {/* Format info */}
        <Text style={s.uploadHint}>
          Images: single-frame inference · Videos: sampled at 2 fps, max 120 frames · Powered by YOLOv8n COCO
        </Text>
      </View>

      {/* ── Preview ── */}
      {fileUri ? (
        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <View style={s.previewTitleRow}>
              <Ionicons name={isVideo ? 'videocam-outline' : 'image-outline'} size={15} color={isVideo ? '#7c3aed' : '#0f172a'} />
              <Text style={s.previewTitle} numberOfLines={1}>{fileName || (isVideo ? 'Selected Video' : 'Selected Image')}</Text>
              {isVideo && (
                <View style={s.videoBadge}><Text style={s.videoBadgeText}>VIDEO</Text></View>
              )}
            </View>
            {!loading && (
              <Pressable onPress={reset} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={22} color="#64748b" />
              </Pressable>
            )}
          </View>

          {isVideo ? (
            <View style={s.videoPlaceholder}>
              <Ionicons name="play-circle-outline" size={56} color="#7c3aed" />
              <Text style={s.videoPlaceholderText}>Video ready for analysis</Text>
              <Text style={s.videoPlaceholderSub}>YOLOv8 samples 2 frames/sec · counts vehicles across all frames</Text>
            </View>
          ) : (
            <Image source={{ uri: fileUri }} style={s.previewImage} resizeMode="cover" />
          )}
        </View>
      ) : (
        <View style={s.emptyState}>
          <Ionicons name="camera-outline" size={52} color="#cbd5e1" />
          <Text style={s.emptyStateText}>No file selected</Text>
          <Text style={s.emptyStateSub}>Choose a traffic photo or video above to start detection</Text>
        </View>
      )}

      {/* ── Loading ── */}
      {loading && (
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={isVideo ? '#7c3aed' : '#0284c7'} />
          <Text style={s.loadingTitle}>
            {isVideo ? 'Analyzing Video with YOLOv8…' : 'Analyzing Image with YOLOv8…'}
          </Text>
          <Text style={s.loadingSteps}>
            {isVideo
              ? 'Sampling frames · Detecting vehicles · Aggregating counts across frames'
              : 'Detecting vehicles · Counting objects · Scoring severity'}
          </Text>
        </View>
      )}

      {/* ── Error ── */}
      {errorMsg && !loading && (
        <View style={s.errorCard}>
          <Ionicons name="alert-circle-outline" size={22} color="#dc2626" />
          <Text style={s.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* ── Results ── */}
      {result && !loading && severity && (
        <View style={s.resultsContainer}>

          <View style={[s.severityHero, { borderColor: severity.border, backgroundColor: severity.bg }]}>
            <View style={s.severityLeft}>
              <Ionicons name={severity.icon as any} size={32} color={severity.color} />
              <View>
                <Text style={s.severityLabel}>Traffic Severity</Text>
                <Text style={[s.severityValue, { color: severity.color }]}>{severity.label}</Text>
              </View>
            </View>
            <View style={[s.severityBadge, { backgroundColor: severity.color }]}>
              <Text style={s.severityBadgeText}>{result.total_vehicles} vehicles</Text>
            </View>
          </View>

          <Text style={[s.severityDesc, { color: severity.color }]}>{severity.desc}</Text>

          <View style={s.breakdownCard}>
            <View style={s.breakdownHeader}>
              <Ionicons name="bar-chart-outline" size={18} color="#0f172a" />
              <Text style={s.breakdownTitle}>Vehicle Breakdown</Text>
              <View style={s.totalPill}><Text style={s.totalPillText}>Total: {result.total_vehicles}</Text></View>
            </View>
            <VehicleRow emoji="🚗" label="Cars"        count={result.vehicle_counts.car}        total={result.total_vehicles} color="#0284c7" />
            <View style={s.divider} />
            <VehicleRow emoji="🏍️" label="Motorcycles" count={result.vehicle_counts.motorcycle} total={result.total_vehicles} color="#7c3aed" />
            <View style={s.divider} />
            <VehicleRow emoji="🚌" label="Buses"       count={result.vehicle_counts.bus}        total={result.total_vehicles} color="#d97706" />
            <View style={s.divider} />
            <VehicleRow emoji="🚚" label="Trucks"      count={result.vehicle_counts.truck}      total={result.total_vehicles} color="#dc2626" />
          </View>

          <View style={s.metaRow}>
            <View style={s.metaChip}>
              <Ionicons name="flash-outline" size={13} color="#0284c7" />
              <Text style={s.metaChipText}>{inferenceMs != null ? `${inferenceMs} ms` : '—'}</Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="hardware-chip-outline" size={13} color="#0284c7" />
              <Text style={s.metaChipText}>YOLOv8n · COCO</Text>
            </View>
            <View style={[s.metaChip, result.source_type === 'video' && { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
              <Ionicons name={result.source_type === 'video' ? 'videocam-outline' : 'image-outline'} size={13} color={result.source_type === 'video' ? '#7c3aed' : '#0284c7'} />
              <Text style={[s.metaChipText, result.source_type === 'video' && { color: '#7c3aed' }]}>{result.source_type}</Text>
            </View>
          </View>

          <Pressable style={({ pressed }) => [s.scanAgainBtn, pressed && { opacity: 0.75 }]} onPress={reset}>
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={s.scanAgainText}>Scan Another Image or Video</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f8fafc', paddingTop: NAV_HEIGHT },
  content: { padding: Spacing.four, gap: Spacing.four, maxWidth: 800, width: '100%', alignSelf: 'center' as const },

  header:   { gap: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:    { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', lineHeight: 19 },

  uploadCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.four, gap: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  uploadCardTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  btnRow:     { flexDirection: 'row', gap: 10 },
  uploadHint: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  previewCard:    { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  previewHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: 12 },
  previewTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  previewTitle:   { fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1 },
  videoBadge:     { backgroundColor: '#ede9fe', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  videoBadgeText: { fontSize: 10, fontWeight: '900', color: '#7c3aed', letterSpacing: 0.5 },
  previewImage:   { width: '100%', height: 260, backgroundColor: '#0f172a' },
  videoPlaceholder: { height: 180, backgroundColor: '#faf5ff', justifyContent: 'center', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#ede9fe' },
  videoPlaceholderText: { fontSize: 15, fontWeight: '800', color: '#7c3aed' },
  videoPlaceholderSub:  { fontSize: 11, color: '#a78bfa', textAlign: 'center', paddingHorizontal: 24 },

  emptyState:    { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyStateText:{ fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  emptyStateSub: { fontSize: 12, color: '#cbd5e1', textAlign: 'center', paddingHorizontal: 32 },

  loadingCard:  { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.five, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e0f2fe' },
  loadingTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  loadingSteps: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  errorCard: { backgroundColor: '#fef2f2', borderRadius: 16, padding: Spacing.four, borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  errorText: { fontSize: 13, color: '#991b1b', fontWeight: '600', flex: 1 },

  resultsContainer: { gap: Spacing.three },

  severityHero:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1.5, padding: Spacing.four },
  severityLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityLabel:     { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 },
  severityValue:     { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  severityBadge:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  severityBadgeText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  severityDesc:      { fontSize: 13, fontWeight: '600', marginTop: -6 },

  breakdownCard:   { backgroundColor: '#ffffff', borderRadius: 20, padding: Spacing.four, gap: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  breakdownTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1 },
  totalPill:       { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  totalPillText:   { fontSize: 12, fontWeight: '700', color: '#475569' },

  vehicleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleEmoji:    { fontSize: 26, width: 36, textAlign: 'center' },
  vehicleInfo:     { flex: 1, gap: 4 },
  vehicleLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleLabel:    { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  vehicleCount:    { fontSize: 20, fontWeight: '900' },
  vehiclePct:      { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  barTrack: { height: 7, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4 },
  divider:  { height: 1, backgroundColor: '#f1f5f9' },

  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#bae6fd' },
  metaChipText:  { fontSize: 12, fontWeight: '700', color: '#0369a1' },

  scanAgainBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0284c7', paddingVertical: 14, borderRadius: 14 },
  scanAgainText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});

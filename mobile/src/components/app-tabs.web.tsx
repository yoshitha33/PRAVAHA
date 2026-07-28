/**
 * Web-only tab navigation.
 *
 * - Desktop (≥ 768px): horizontal top navbar with all tab labels visible.
 * - Mobile web (< 768px): PRAVAHA logo + hamburger button in a top bar;
 *   tapping the hamburger slides open a full-width drawer with nav items.
 *
 * Uses expo-router's <Tabs> (standard, works on web) instead of NativeTabs
 * (native-only). The active tab is highlighted with the brand blue.
 */

import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { name: string; label: string; icon: string; iconActive: string }[] = [
  { name: 'index',    label: 'Home',        icon: 'home-outline',        iconActive: 'home' },
  { name: 'map',      label: 'Navigate',    icon: 'map-outline',         iconActive: 'map' },
  { name: 'predict',  label: 'Road Status', icon: 'speedometer-outline', iconActive: 'speedometer' },
  { name: 'detect',   label: 'Traffic AI',  icon: 'eye-outline',         iconActive: 'eye' },
  { name: 'delivery', label: 'Delivery',    icon: 'bicycle-outline',     iconActive: 'bicycle' },
  { name: 'alerts',   label: 'Alerts',      icon: 'notifications-outline', iconActive: 'notifications' },
];

const BRAND_BLUE = '#0284c7';
const MOBILE_BREAKPOINT = 768;

// ─── Hamburger drawer ─────────────────────────────────────────────────────────
function HamburgerNav({ activeSegment }: { activeSegment: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  function openDrawer() {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function closeDrawer() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -320, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 200, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  }

  function navigate(name: string) {
    closeDrawer();
    setTimeout(() => router.push((name === 'index' ? '/' : `/${name}`) as any), 240);
  }

  const activeName = activeSegment === '' || activeSegment === '(index)' ? 'index' : activeSegment;
  const activeItem = NAV_ITEMS.find(i => i.name === activeName);

  return (
    <>
      {/* ── Top bar ── */}
      <View style={h.topBar}>
        {/* Logo */}
        <View style={h.logoRow}>
          <View style={h.logoBubble}>
            <Text style={h.logoMark}>🚦</Text>
          </View>
          <Text style={h.logoText}>PRAVAHA</Text>
        </View>

        {/* Current screen label */}
        <Text style={h.currentLabel} numberOfLines={1}>
          {activeItem?.label ?? ''}
        </Text>

        {/* Hamburger button */}
        <Pressable
          onPress={open ? closeDrawer : openDrawer}
          style={({ pressed }) => [h.menuBtn, pressed && { opacity: 0.7 }]}
          hitSlop={10}
        >
          <Ionicons name={open ? 'close' : 'menu'} size={26} color="#0f172a" />
        </Pressable>
      </View>

      {/* ── Backdrop + Drawer ── */}
      {open && (
        <>
          {/* Dim backdrop */}
          <Animated.View style={[h.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>

          {/* Sliding drawer */}
          <Animated.View style={[h.drawer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer header */}
            <View style={h.drawerHeader}>
              <View style={h.drawerLogoRow}>
                <View style={h.logoBubbleLg}>
                  <Text style={h.logoMarkLg}>🚦</Text>
                </View>
                <View>
                  <Text style={h.drawerBrand}>PRAVAHA</Text>
                  <Text style={h.drawerTagline}>Predictive Traffic AI</Text>
                </View>
              </View>
              <Pressable onPress={closeDrawer} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={28} color="#64748b" />
              </Pressable>
            </View>

            <View style={h.drawerDivider} />

            {/* Nav items */}
            {NAV_ITEMS.map((item) => {
              const isActive = item.name === activeName;
              return (
                <Pressable
                  key={item.name}
                  style={({ pressed }) => [
                    h.drawerItem,
                    isActive && h.drawerItemActive,
                    pressed && h.drawerItemPressed,
                  ]}
                  onPress={() => navigate(item.name)}
                >
                  <View style={[h.drawerIconBg, isActive && h.drawerIconBgActive]}>
                    <Ionicons
                      name={(isActive ? item.iconActive : item.icon) as any}
                      size={20}
                      color={isActive ? '#ffffff' : '#64748b'}
                    />
                  </View>
                  <Text style={[h.drawerItemLabel, isActive && h.drawerItemLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <View style={h.activeIndicator} />
                  )}
                </Pressable>
              );
            })}

            <View style={h.drawerFooter}>
              <Text style={h.drawerFooterText}>Road DNA · YOLOv8 · sklearn ML</Text>
            </View>
          </Animated.View>
        </>
      )}
    </>
  );
}

// ─── Desktop nav bar ──────────────────────────────────────────────────────────
function DesktopNav({ activeSegment }: { activeSegment: string }) {
  const router = useRouter();
  const activeName = activeSegment === '' || activeSegment === '(index)' ? 'index' : activeSegment;

  return (
    <View style={d.topBar}>
      {/* Logo */}
      <Pressable style={d.logoRow} onPress={() => router.push('/')}>
        <View style={d.logoBubble}>
          <Text style={d.logoMark}>🚦</Text>
        </View>
        <Text style={d.logoText}>PRAVAHA</Text>
      </Pressable>

      {/* Nav links */}
      <View style={d.navLinks}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.name === activeName;
          return (
            <Pressable
              key={item.name}
              style={({ pressed }) => [d.navLink, isActive && d.navLinkActive, pressed && { opacity: 0.75 }]}
              onPress={() => router.push((item.name === 'index' ? '/' : `/${item.name}`) as any)}
            >
              <Ionicons
                name={(isActive ? item.iconActive : item.icon) as any}
                size={15}
                color={isActive ? '#ffffff' : '#64748b'}
              />
              <Text style={[d.navLinkText, isActive && d.navLinkTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function AppTabs() {
  const { width } = useWindowDimensions();
  const segments  = useSegments();
  const isMobile  = width < MOBILE_BREAKPOINT;

  // Derive active segment name
  const activeSegment = (segments[segments.length - 1] as string) ?? '';

  return (
    <View style={{ flex: 1 }}>
      {/* Responsive nav header */}
      {isMobile
        ? <HamburgerNav activeSegment={activeSegment} />
        : <DesktopNav   activeSegment={activeSegment} />
      }

      {/* Screen content — Tabs registers all routes for expo-router */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        >
          <Tabs.Screen name="index"    />
          <Tabs.Screen name="map"      />
          <Tabs.Screen name="predict"  />
          <Tabs.Screen name="detect"   />
          <Tabs.Screen name="delivery" />
          <Tabs.Screen name="alerts"   />
        </Tabs>
      </View>
    </View>
  );
}

// ─── Hamburger styles ─────────────────────────────────────────────────────────
const h = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBubble:{ width: 32, height: 32, borderRadius: 10, backgroundColor: BRAND_BLUE, justifyContent: 'center', alignItems: 'center' },
  logoMark:  { fontSize: 16 },
  logoText:  { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  currentLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', flex: 1, textAlign: 'center' },
  menuBtn:   { padding: 4 },

  // Backdrop
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 200,
  },

  // Drawer
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 300,
    backgroundColor: '#ffffff',
    zIndex: 300,
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  drawerLogoRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBubbleLg:    { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND_BLUE, justifyContent: 'center', alignItems: 'center' },
  logoMarkLg:      { fontSize: 22 },
  drawerBrand:     { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  drawerTagline:   { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 1 },
  drawerDivider:   { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16, marginBottom: 8 },

  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 12, marginVertical: 2,
    paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 14,
  },
  drawerItemActive:  { backgroundColor: '#f0f9ff' },
  drawerItemPressed: { backgroundColor: '#f8fafc' },
  drawerIconBg:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  drawerIconBgActive:{ backgroundColor: BRAND_BLUE },
  drawerItemLabel:       { flex: 1, fontSize: 15, fontWeight: '700', color: '#475569' },
  drawerItemLabelActive: { color: '#0f172a', fontWeight: '800' },
  activeIndicator:   { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND_BLUE },

  drawerFooter:     { marginTop: 'auto' as any, padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  drawerFooterText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: '600' },
});

// ─── Desktop styles ───────────────────────────────────────────────────────────
const d = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 0,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    gap: 32,
  },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBubble:{ width: 34, height: 34, borderRadius: 10, backgroundColor: BRAND_BLUE, justifyContent: 'center', alignItems: 'center' },
  logoMark:  { fontSize: 18 },
  logoText:  { fontSize: 17, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },

  navLinks:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLink:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  navLinkActive:{ backgroundColor: BRAND_BLUE },
  navLinkText:      { fontSize: 13, fontWeight: '700', color: '#64748b' },
  navLinkTextActive:{ color: '#ffffff' },
});

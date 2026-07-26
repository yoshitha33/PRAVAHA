import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="home-outline" activeIcon="home">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="map" href="/map" asChild>
            <TabButton icon="map-outline" activeIcon="map">Navigate</TabButton>
          </TabTrigger>
          <TabTrigger name="roadstatus" href="/predict" asChild>
            <TabButton icon="speedometer-outline" activeIcon="speedometer">Road Status</TabButton>
          </TabTrigger>
          <TabTrigger name="detect" href="/detect" asChild>
            <TabButton icon="videocam-outline" activeIcon="videocam">Traffic AI</TabButton>
          </TabTrigger>
          <TabTrigger name="delivery" href="/delivery" asChild>
            <TabButton icon="bicycle-outline" activeIcon="bicycle">Delivery</TabButton>
          </TabTrigger>
          <TabTrigger name="alerts" href="/alerts" asChild>
            <TabButton icon="notifications-outline" activeIcon="notifications">Alerts</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  activeIcon,
  ...props
}: TabTriggerSlotProps & { icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Ionicons
          name={isFocused ? activeIcon : icon}
          size={16}
          color={isFocused ? '#ffffff' : '#64748b'}
        />
        <ThemedText
          type="smallBold"
          style={[styles.tabText, isFocused ? styles.tabTextActive : styles.tabTextInactive]}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brandContainer}>
          <Ionicons name="navigate-circle" size={24} color="#0284c7" />
          <ThemedText type="smallBold" style={styles.brandText}>
            PRAVAHA
          </ThemedText>
        </View>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 100,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 'auto',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactive: {
    color: '#64748b',
  },
});

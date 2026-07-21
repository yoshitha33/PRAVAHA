import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function HomeHero() {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.tag}>
        <ThemedText type="smallBold">Live map</ThemedText>
      </View>
      <ThemedText type="title" style={styles.title}>
        Find the safest Bangalore route before congestion builds.
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Center the map on your current location, tap any point to pin a destination, and switch to known traffic hotspots with one touch.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(32, 138, 239, 0.12)',
  },
  title: {
    lineHeight: 42,
  },
  subtitle: {
    lineHeight: 24,
  },
});

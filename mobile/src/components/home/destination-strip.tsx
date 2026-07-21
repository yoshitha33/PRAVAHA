import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DestinationOption } from '@/hooks/use-home-map';

type DestinationStripProps = {
  destinations: DestinationOption[];
  selectedDestinationId: string | null;
  onSelectDestination: (destination: DestinationOption) => void;
  onRecenter: () => void;
};

export function DestinationStrip({
  destinations,
  selectedDestinationId,
  onSelectDestination,
  onRecenter,
}: DestinationStripProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold">Destination selection</ThemedText>
        <Pressable onPress={onRecenter} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="textSecondary">
            Recenter
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText themeColor="textSecondary" style={styles.helperText}>
        Tap a suggested destination or press anywhere on the map to drop a custom pin.
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {destinations.map((destination) => {
          const selected = destination.id === selectedDestinationId;

          return (
            <Pressable
              key={destination.id}
              onPress={() => onSelectDestination(destination)}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
            >
              <ThemedText type="smallBold" style={styles.chipTitle}>
                {destination.label}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.chipSubtitle}>
                {destination.subtitle}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    lineHeight: 22,
  },
  scrollContent: {
    gap: Spacing.three,
  },
  chip: {
    width: 180,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(32, 138, 239, 0.12)',
    gap: Spacing.half,
  },
  chipSelected: {
    borderColor: '#208AEF',
    backgroundColor: 'rgba(32, 138, 239, 0.14)',
  },
  chipTitle: {
    lineHeight: 22,
  },
  chipSubtitle: {
    lineHeight: 18,
  },
});

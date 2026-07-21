import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type PredictionBadgeProps = {
  value: 'Low' | 'Medium' | 'High';
};

const colors = {
  Low: '#16a34a',
  Medium: '#f59e0b',
  High: '#dc2626',
} as const;

export function PredictionBadge({ value }: PredictionBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors[value] }]}>
      <ThemedText type="smallBold" style={styles.label}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  label: {
    color: '#ffffff',
  },
});

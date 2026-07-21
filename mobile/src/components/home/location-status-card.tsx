import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type LocationStatusCardProps = {
  permissionGranted: boolean;
  isLoadingLocation: boolean;
  errorMessage: string | null;
  currentLocationLabel: string;
  destinationLabel: string;
};

export function LocationStatusCard({
  permissionGranted,
  isLoadingLocation,
  errorMessage,
  currentLocationLabel,
  destinationLabel,
}: LocationStatusCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.row}>
        <View style={styles.metric}>
          <ThemedText type="small" themeColor="textSecondary">
            Location
          </ThemedText>
          <ThemedText type="smallBold">
            {isLoadingLocation ? 'Locating...' : permissionGranted ? 'Enabled' : 'Unavailable'}
          </ThemedText>
        </View>
        <View style={styles.metric}>
          <ThemedText type="small" themeColor="textSecondary">
            Current
          </ThemedText>
          <ThemedText type="smallBold">{currentLocationLabel}</ThemedText>
        </View>
      </View>

      <View style={styles.metricStack}>
        <ThemedText type="small" themeColor="textSecondary">
          Destination
        </ThemedText>
        <ThemedText type="smallBold">{destinationLabel}</ThemedText>
      </View>

      {errorMessage ? (
        <ThemedView type="backgroundSelected" style={styles.errorBox}>
          <ThemedText type="small" themeColor="textSecondary">
            {errorMessage}
          </ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metric: {
    flex: 1,
    gap: Spacing.half,
  },
  metricStack: {
    gap: Spacing.half,
  },
  errorBox: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
});

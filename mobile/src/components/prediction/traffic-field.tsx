import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type TrafficFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad';
  placeholder?: string;
};

export function TrafficField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: TrafficFieldProps) {
  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedView type="backgroundElement" style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#8a8a8a"
          style={styles.input}
        />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  inputShell: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
  },
});

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <ThemedText style={styles.logoText}>PRAVAHA</ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          PRAVAHA (प्रवाह)
        </ThemedText>
        
        <ThemedText themeColor="textSecondary" style={styles.tagline}>
          Predict Bangalore traffic before congestion forms
        </ThemedText>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={'#0284c7'} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading AI Prediction Models...
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  loaderContainer: {
    marginTop: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
});

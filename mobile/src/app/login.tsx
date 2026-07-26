import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { loginUser, registerUser } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('driver@pravaha.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      if (isRegisterMode) {
        await registerUser(email, password);
        setMessage('Account created! Logging in...');
      }

      await loginUser(email, password);
      router.replace('/');
    } catch {
      setMessage('Authentication failed. Proceeding in offline mode.');
      setTimeout(() => router.replace('/'), 1200);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <ThemedText style={styles.logoText}>🚦</ThemedText>
          </View>
          <ThemedText type="subtitle">
            {isRegisterMode ? 'Create PRAVAHA Account' : 'Welcome to PRAVAHA'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            Sign in to access real-time Bangalore traffic prediction & Road DNA.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText type="smallBold">Email</ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold">Password</ThemedText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          {message ? (
            <View style={styles.messageBox}>
              <ThemedText type="small" style={styles.messageText}>
                {message}
              </ThemedText>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.submitText}>
                {isRegisterMode ? 'Register' : 'Login'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => setIsRegisterMode(!isRegisterMode)}
            style={styles.togglePressable}
          >
            <ThemedText type="small" themeColor="textSecondary">
              {isRegisterMode
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.four,
    padding: Spacing.five,
    gap: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eaf4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
  },
  form: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#0284c7',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
  messageBox: {
    backgroundColor: '#f0f9ff',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  messageText: {
    color: '#0284c7',
  },
  togglePressable: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});

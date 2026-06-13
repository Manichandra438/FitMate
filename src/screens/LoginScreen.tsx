import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing } from '../theme';
import GradientButton from '../components/ui/GradientButton';
import { signInWithGoogle } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

const FEATURES = [
  { icon: 'restaurant' as const, text: 'Personalized diet plan built for your goal' },
  { icon: 'cloud-done' as const, text: 'Data backed up safely to your Google account' },
  { icon: 'stats-chart' as const, text: 'Track meals, water, weight & streaks' },
];

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Setup required',
        'Firebase is not configured yet. Add your Firebase config in src/services/firebase.ts (see README).'
      );
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle();
      // Auth listener in App.tsx takes over from here.
    } catch (err: any) {
      Alert.alert('Sign-in failed', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.header}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Ionicons name="fitness" size={42} color={colors.primary} />
          </View>
          <Text style={styles.logo}>FitMate</Text>
          <Text style={styles.tagline}>
            The smart diet planner & all-in-one tracker
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <GradientButton
            title="Continue with Google"
            onPress={handleSignIn}
            loading={loading}
            icon={<Ionicons name="logo-google" size={20} color="#fff" />}
          />
          <Text style={styles.disclaimer}>
            Your data is stored privately in your own account.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: 80 },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logo: { fontSize: 44, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  features: { gap: spacing.lg, paddingHorizontal: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  footer: { gap: spacing.md, marginBottom: spacing.lg },
  disclaimer: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});

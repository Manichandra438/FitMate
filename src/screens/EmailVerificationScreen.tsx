import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing } from '../theme';
import GradientButton from '../components/ui/GradientButton';
import { auth } from '../services/firebase';
import { resendVerificationEmail, signOutAll } from '../services/auth';

interface Props {
  email: string;
  onVerified: () => void;
}

export default function EmailVerificationScreen({ email, onVerified }: Props) {
  const [checking, setChecking]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown]   = useState(0);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        onVerified();
      } else {
        Alert.alert(
          'Not verified yet',
          'Please click the link in your inbox, then tap "I\'ve verified it" again.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not check verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Email sent', `Verification link re-sent to ${email}`);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      Alert.alert('Failed', err?.message ?? 'Could not resend. Try again shortly.');
    } finally {
      setResending(false);
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
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons name="mail-unread" size={48} color={colors.primary} />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.sub}>We sent a verification link to</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.hint}>
            Click the link in the email to activate your account.{'\n'}
            Check your spam folder if you don't see it.
          </Text>

          <GradientButton
            title={checking ? 'Checking…' : "I've verified it →"}
            onPress={handleCheck}
            loading={checking}
          />

          <TouchableOpacity
            style={[styles.resendBtn, (cooldown > 0 || resending) && styles.resendDisabled]}
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.resendText, cooldown > 0 && { color: colors.textMuted }]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={signOutAll}>
            <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
            <Text style={styles.signOutText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  resendBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    minWidth: 160,
    minHeight: 44,
    justifyContent: 'center',
  },
  resendDisabled: { borderColor: colors.border },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    padding: 8,
  },
  signOutText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

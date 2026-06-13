import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing } from '../theme';
import GradientButton from '../components/ui/GradientButton';
import {
  friendlyAuthError,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

type AuthMethod = 'google' | 'email';
type EmailMode  = 'signin' | 'signup';

export default function LoginScreen() {
  const [method, setMethod]           = useState<AuthMethod>('google');
  const [emailMode, setEmailMode]     = useState<EmailMode>('signin');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const checkFirebase = () => {
    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Setup required',
        'Firebase is not configured yet. Add your Firebase config in src/services/firebase.ts.'
      );
      return false;
    }
    return true;
  };

  const handleGoogle = async () => {
    if (!checkFirebase()) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Sign-in failed', friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!checkFirebase()) return;
    if (!email.trim()) { Alert.alert('Email required', 'Enter your email address.'); return; }
    if (!password)     { Alert.alert('Password required', 'Enter your password.'); return; }
    if (emailMode === 'signup') {
      if (password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return; }
      if (password !== confirm) { Alert.alert('Passwords don\'t match', 'Re-enter your password in both fields.'); return; }
    }
    setLoading(true);
    try {
      if (emailMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        Alert.alert(
          'Account created!',
          'A verification email has been sent. You can verify it at any time from Settings.',
          [{ text: 'Continue' }]
        );
      }
    } catch (err: any) {
      Alert.alert(emailMode === 'signin' ? 'Sign-in failed' : 'Sign-up failed', friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset password',
      'Enter your email and we\'ll send a reset link.',
      async (inputEmail) => {
        if (!inputEmail?.trim()) return;
        try {
          await sendPasswordReset(inputEmail);
          Alert.alert('Email sent', 'Check your inbox for the password reset link.');
        } catch (err: any) {
          Alert.alert('Failed', friendlyAuthError(err));
        }
      },
      'plain-text',
      email,
      'email-address'
    );
  };

  const switchMode = (m: EmailMode) => {
    setEmailMode(m);
    setPassword('');
    setConfirm('');
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <LinearGradient
      colors={gradients.header}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.logoBadge}>
                <Ionicons name="fitness" size={42} color={colors.primary} />
              </View>
              <Text style={styles.logo}>FitMate</Text>
              <Text style={styles.tagline}>Your personal diet & fitness coach</Text>
            </View>

            {/* Method toggle */}
            <View style={styles.methodToggle}>
              <Pressable
                style={[styles.methodBtn, method === 'google' && styles.methodBtnActive]}
                onPress={() => setMethod('google')}
              >
                <Ionicons
                  name="logo-google"
                  size={16}
                  color={method === 'google' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.methodLabel, method === 'google' && styles.methodLabelActive]}>
                  Google
                </Text>
              </Pressable>
              <Pressable
                style={[styles.methodBtn, method === 'email' && styles.methodBtnActive]}
                onPress={() => setMethod('email')}
              >
                <Ionicons
                  name="mail"
                  size={16}
                  color={method === 'email' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.methodLabel, method === 'email' && styles.methodLabelActive]}>
                  Email
                </Text>
              </Pressable>
            </View>

            {method === 'google' ? (
              /* ── Google ── */
              <View style={styles.googleSection}>
                <Text style={styles.sectionHint}>
                  Sign in with your Google account. Your data is backed up automatically.
                </Text>
                <GradientButton
                  title="Continue with Google"
                  onPress={handleGoogle}
                  loading={loading}
                  icon={<Ionicons name="logo-google" size={20} color="#fff" />}
                />
              </View>
            ) : (
              /* ── Email ── */
              <View style={styles.emailSection}>
                {/* Sign in / Create account sub-toggle */}
                <View style={styles.modeToggle}>
                  <Pressable
                    style={[styles.modeBtn, emailMode === 'signin' && styles.modeBtnActive]}
                    onPress={() => switchMode('signin')}
                  >
                    <Text style={[styles.modeLabel, emailMode === 'signin' && styles.modeLabelActive]}>
                      Sign in
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeBtn, emailMode === 'signup' && styles.modeBtnActive]}
                    onPress={() => switchMode('signup')}
                  >
                    <Text style={[styles.modeLabel, emailMode === 'signup' && styles.modeLabelActive]}>
                      Create account
                    </Text>
                  </Pressable>
                </View>

                {/* Email */}
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Password */}
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType={emailMode === 'signup' ? 'next' : 'done'}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>

                {/* Confirm password — sign-up only */}
                {emailMode === 'signup' && (
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder="Confirm password"
                      placeholderTextColor={colors.textMuted}
                      value={confirm}
                      onChangeText={setConfirm}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      returnKeyType="done"
                    />
                    <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                )}

                <GradientButton
                  title={emailMode === 'signin' ? 'Sign in' : 'Create account'}
                  onPress={handleEmailAuth}
                  loading={loading}
                />

                {emailMode === 'signin' && (
                  <Pressable onPress={handleForgotPassword} style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                )}
              </View>
            )}

            <Text style={styles.disclaimer}>
              Your data is stored privately in your own account.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  scroll:    { padding: spacing.xl, paddingBottom: 40 },

  hero:      { alignItems: 'center', marginTop: 40, marginBottom: spacing.xl },
  logoBadge: {
    width: 80, height: 80, borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logo:    { fontSize: 40, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  /* Method toggle (Google / Email) */
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: radius.pill,
  },
  methodBtnActive: { backgroundColor: colors.surface },
  methodLabel:       { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  methodLabelActive: { color: colors.primary },

  /* Google section */
  googleSection: { gap: spacing.lg },
  sectionHint:   { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  /* Email section */
  emailSection: { gap: spacing.md },

  /* Sign in / Create account sub-toggle */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.sm,
  },
  modeBtn:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.pill },
  modeBtnActive: { backgroundColor: colors.surface },
  modeLabel:       { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  modeLabelActive: { color: colors.textPrimary },

  /* Inputs */
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, fontSize: 15, color: colors.textPrimary },
  inputFlex: { flex: 1 },
  eyeBtn:    { padding: 4 },

  forgotBtn:  { alignSelf: 'center', marginTop: 4 },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  disclaimer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});

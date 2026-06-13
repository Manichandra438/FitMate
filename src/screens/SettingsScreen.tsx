import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { cancelAllNotifications, scheduleAllNotifications } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { deleteAccount, signOutAll } from '../services/auth';
import { deleteCloudData, flush, startSync, stopSync } from '../services/sync';
import { exportCSV, exportJSON } from '../services/export';
import { scheduleWidgetRefresh } from '../widgets/updateWidget';
import SectionHeader from '../components/ui/SectionHeader';

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, mealPlan, exercisePlan, resetAll } = useFitStore();
  const [busy, setBusy] = useState<string | null>(null);
  const user = auth.currentUser;

  const dietLabel =
    profile.dietPref === 'veg'
      ? 'Vegetarian'
      : profile.dietPref === 'eggetarian'
      ? 'Eggetarian'
      : 'Non-vegetarian';

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleReschedule = () =>
    run('notif', async () => {
      await scheduleAllNotifications(mealPlan, exercisePlan, profile);
      Alert.alert('Notifications', 'Notifications rescheduled successfully!');
    });

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Your data stays safely in the cloud. Sign out now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () =>
          run('signout', async () => {
            await flush(); // push any pending changes first
            stopSync();
            await signOutAll();
          }),
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset all data',
      'This deletes ALL your logs, weight history and plan — locally and in the cloud. You will go through setup again. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () =>
            run('reset', async () => {
              await cancelAllNotifications();
              try { await flush(); } catch { /* best effort */ }
              stopSync(); // increments syncGeneration — kills any in-flight log fetch
              const uid = auth.currentUser?.uid;
              let cloudDeleted = false;
              if (uid) {
                try {
                  await deleteCloudData(uid);
                  cloudDeleted = true;
                } catch (err) {
                  console.warn('Cloud wipe failed (continuing local reset):', err);
                }
              }
              resetAll();
              // Wipe AsyncStorage directly so the persist layer has no stale snapshot.
              await AsyncStorage.removeItem('fitmate-storage');
              scheduleWidgetRefresh();
              // Only restart sync if cloud was actually cleared — otherwise
              // startSync would re-download the old data and undo the reset.
              if (uid && cloudDeleted) startSync().catch(console.warn);
            }),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Google account link and ALL data from the cloud. You cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Are you absolutely sure?',
              `Your account "${user?.email}" and every byte of data will be gone forever. No recovery possible.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete forever',
                  style: 'destructive',
                  onPress: () =>
                    run('delete', async () => {
                      await cancelAllNotifications();
                      try { await flush(); } catch { /* best effort */ }
                      stopSync(); // increments syncGeneration — kills any in-flight log fetch
                      const uid = auth.currentUser?.uid;
                      if (uid) {
                        try {
                          await deleteCloudData(uid);
                        } catch (err) {
                          console.warn('Cloud delete failed:', err);
                        }
                      }
                      await deleteAccount();
                      resetAll();
                      await AsyncStorage.removeItem('fitmate-storage');
                      scheduleWidgetRefresh();
                    }),
                },
              ]
            ),
        },
      ]
    );
  };

  const Row = ({
    icon,
    label,
    sub,
    onPress,
    danger,
    loading,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sub?: string;
    onPress: () => void;
    danger?: boolean;
    loading?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, danger && styles.rowDanger]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!!busy}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.redBg }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.red : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.red }]}>
          {loading ? 'Working…' : label}
        </Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      {/* Account header */}
      <View style={styles.accountCard}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>
              {(profile.name || user?.displayName || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{profile.name || user?.displayName}</Text>
          <Text style={styles.accountEmail}>{user?.email}</Text>
          <View style={styles.syncBadge}>
            <Ionicons name="cloud-done" size={12} color={colors.green} />
            <Text style={styles.syncText}>Synced to Google account</Text>
          </View>
        </View>
      </View>

      {/* Plan summary */}
      <SectionHeader title="Your plan" />
      <View style={styles.planCard}>
        <PlanStat value={`${profile.calorieGoal}`} unit="kcal/day" />
        <PlanStat value={`${profile.proteinGoal}g`} unit="protein" />
        <PlanStat value={`${profile.waterGoal}`} unit="glasses" />
        <PlanStat value={`${profile.goalWeight}`} unit="kg goal" />
      </View>
      <Text style={styles.planMeta}>
        {dietLabel} · {profile.mealsPerDay} meals/day · {mealPlan.length} meals planned
      </Text>
      <Row
        icon="create"
        label="Edit profile & preferences"
        sub="Update weight, height, diet, schedule — recalculates plan"
        onPress={() => navigation.navigate('EditProfile')}
      />
      <Row
        icon="refresh"
        label="Redo setup & regenerate plan"
        sub="Re-answer the questions; your logs are kept"
        onPress={() =>
          Alert.alert(
            'Redo setup',
            'You will go through the questions again and get a fresh plan. Your history is kept.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Redo setup',
                onPress: () => useFitStore.getState().setProfile({ onboarded: false }),
              },
            ]
          )
        }
      />

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <Row
        icon="notifications"
        label="Reschedule notifications"
        sub="Re-apply meal, water, weight & exercise reminders"
        onPress={handleReschedule}
        loading={busy === 'notif'}
      />

      {/* Data */}
      <SectionHeader title="Your data" />
      <Row
        icon="download"
        label="Export as JSON"
        sub="Full backup of profile, plan & all logs"
        onPress={() => run('json', exportJSON)}
        loading={busy === 'json'}
      />
      <Row
        icon="grid"
        label="Export as CSV"
        sub="Daily summary + weight history spreadsheets"
        onPress={() => run('csv', exportCSV)}
        loading={busy === 'csv'}
      />

      {/* Account */}
      <SectionHeader title="Account" />
      <Row
        icon="log-out"
        label="Sign out"
        sub="Data stays in the cloud"
        onPress={handleSignOut}
        loading={busy === 'signout'}
      />

      {/* Danger zone */}
      <SectionHeader title="Danger zone" />
      <Row
        icon="trash"
        label="Reset all data"
        sub="Wipe everything and start over from setup"
        onPress={handleReset}
        danger
        loading={busy === 'reset'}
      />
      <Row
        icon="skull"
        label="Delete account"
        sub="Permanently delete account + all cloud data"
        onPress={handleDeleteAccount}
        danger
        loading={busy === 'delete'}
      />

      {/* About */}
      <SectionHeader title="About" />
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>FitMate v2.0</Text>
        <Text style={styles.aboutText}>
          Your personal diet planner & tracker. {profile.startWeight} kg →{' '}
          {profile.goalWeight} kg. Keep going — you've got this! 💪
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function PlanStat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.planStat}>
      <Text style={styles.planStatValue}>{value}</Text>
      <Text style={styles.planStatUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 56 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: spacing.lg },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '800', color: colors.primary },
  accountName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  accountEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  syncText: { fontSize: 11, fontWeight: '600', color: colors.green },
  planCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  planStat: { alignItems: 'center' },
  planStatValue: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  planStatUnit: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  planMeta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowDanger: { borderColor: colors.red, backgroundColor: colors.redBg },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  aboutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  aboutText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

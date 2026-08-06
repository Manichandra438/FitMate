import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AppState, StyleSheet } from 'react-native';
import './src/services/firebase'; // initialize Firebase before anything uses it
import AppNavigator from './src/navigation/AppNavigator';
import { useFitStore } from './src/store/useFitStore';
import { scheduleAllNotifications, checkAndSendSmartReminders } from './src/services/notifications';
import { useAuth } from './src/hooks/useAuth';
import { startSync, stopSync } from './src/services/sync';
import { scheduleWidgetRefresh } from './src/widgets/updateWidget';
import AppAlertHost from './src/components/AppAlert';

export default function App() {
  const { user, initializing } = useAuth();
  const [hydrating, setHydrating] = useState(true);
  // Persist (AsyncStorage) rehydration gate — local-first rendering depends on
  // knowing whether the store has loaded yet, so we don't flash Login over data
  // that is about to appear.
  const [hydrated, setHydrated] = useState(() => useFitStore.persist.hasHydrated());
  const onboarded = useFitStore((s) => s.profile.onboarded);
  const syncedUid = useRef<string | null>(null);

  useEffect(() => {
    if (useFitStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useFitStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  // Start/stop the cloud sync engine on auth changes.
  useEffect(() => {
    if (initializing) return;
    if (user) {
      if (syncedUid.current === user.uid) return;
      syncedUid.current = user.uid;
      startSync()
        .catch(console.warn)
        .finally(() => setHydrating(false));
    } else {
      syncedUid.current = null;
      stopSync();
      setHydrating(false);
      // Do NOT wipe local data on a null session. Losing the Firebase session
      // (token expiry / revocation) must not destroy the user's local-first
      // data — they'd see it flash then vanish. Explicit sign-out and account
      // deletion in Settings handle clearing the store and AsyncStorage.
    }
  }, [user, initializing]);

  // Once onboarded: today's log, notifications, widget.
  useEffect(() => {
    if (!onboarded) return;
    const { mealPlan, exercisePlan, profile, ensureTodayLog } =
      useFitStore.getState();
    ensureTodayLog();
    scheduleAllNotifications(mealPlan, exercisePlan, profile).catch(console.warn);
    scheduleWidgetRefresh();
  }, [onboarded]);

  // Keep the home-screen widget fresh on any data change.
  useEffect(() => {
    const unsubscribe = useFitStore.subscribe(() => scheduleWidgetRefresh());
    return unsubscribe;
  }, []);

  // Smart reminders: fire contextual nudges when app comes to foreground.
  useEffect(() => {
    const handler = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const { mealPlan, profile, getTodayLog } = useFitStore.getState();
      if (!profile.onboarded) return;
      const log = getTodayLog();
      checkAndSendSmartReminders(mealPlan, log, profile).catch(() => {});
    });
    return () => handler.remove();
  }, []);

  // Handle notification taps
  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener(() => {
        // Navigation on tap can be wired here in a future update
      });
    } catch (_) {
      // Notifications not available in Expo Go SDK53+
    }
    return () => sub?.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator
          user={user}
          initializing={initializing}
          hydrating={hydrating}
          hydrated={hydrated}
          onboarded={onboarded}
        />
        <AppAlertHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { StyleSheet } from 'react-native';
import './src/services/firebase'; // initialize Firebase before anything uses it
import AppNavigator from './src/navigation/AppNavigator';
import { useFitStore } from './src/store/useFitStore';
import { scheduleAllNotifications } from './src/services/notifications';
import { useAuth } from './src/hooks/useAuth';
import { startSync, stopSync } from './src/services/sync';
import { scheduleWidgetRefresh } from './src/widgets/updateWidget';

export default function App() {
  const { user, initializing } = useAuth();
  const [hydrating, setHydrating] = useState(false);
  const onboarded = useFitStore((s) => s.profile.onboarded);
  const syncedUid = useRef<string | null>(null);

  // Start/stop the cloud sync engine on auth changes.
  useEffect(() => {
    if (initializing) return;
    if (user) {
      if (syncedUid.current === user.uid) return;
      syncedUid.current = user.uid;
      // Only show splash on fresh installs — returning users see local data instantly.
      const hasLocalData = useFitStore.getState().profile.onboarded;
      if (!hasLocalData) setHydrating(true);
      startSync()
        .catch(console.warn)
        .finally(() => setHydrating(false));
    } else {
      syncedUid.current = null;
      stopSync();
      useFitStore.getState().resetAll();
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
          loading={initializing || hydrating}
          onboarded={onboarded}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

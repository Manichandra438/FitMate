import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeStreak, computeTodayTotals, todayStr } from '../services/statsHelpers';
import { DayLog, UserProfile } from '../types';

export interface WidgetData {
  onboarded: boolean;
  kcalEaten: number;
  kcalGoal: number;
  kcalRemaining: number;
  water: number;
  waterGoal: number;
  streak: number;
  name: string;
}

const EMPTY: WidgetData = {
  onboarded: false,
  kcalEaten: 0,
  kcalGoal: 0,
  kcalRemaining: 0,
  water: 0,
  waterGoal: 8,
  streak: 0,
  name: '',
};

/**
 * Reads the zustand persist blob directly from AsyncStorage. Runs in the
 * widget's headless JS context where the React store isn't mounted.
 */
export async function readWidgetData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem('fitmate-storage');
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state) return EMPTY;

    const profile: UserProfile | undefined = state.profile;
    const logs: Record<string, DayLog> = state.logs ?? {};
    if (!profile?.onboarded) return EMPTY;

    const todayLog = logs[todayStr()];
    const totals = computeTodayTotals(todayLog);

    return {
      onboarded: true,
      kcalEaten: totals.kcal,
      kcalGoal: profile.calorieGoal,
      kcalRemaining: Math.max(profile.calorieGoal - totals.kcal, 0),
      water: todayLog?.water ?? 0,
      waterGoal: profile.waterGoal,
      streak: computeStreak(logs),
      name: profile.name,
    };
  } catch {
    return EMPTY;
  }
}

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { DayLog, Meal, ExercisePlan, UserProfile } from '../types';

// Expo Go (SDK 53+) removed remote push notifications.
// Local notifications still work. We skip push registration in Expo Go.
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  (Constants as any).appOwnership === 'expo';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (_) {
  // silently ignore in Expo Go
}

const parseTime = (t: string): { hour: number; minute: number } => {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return { hour: isNaN(h) ? 7 : h, minute: isNaN(m) ? 0 : m };
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  try {
    // In Expo Go SDK53+, requestPermissionsAsync triggers remote push
    // registration which crashes. Use getPermissionsAsync only.
    if (isExpoGo) {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('Notifications not available in this environment:', err);
    return false;
  }
}

async function cancelByPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith(prefix)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function scheduleMealReminders(meals: Meal[]): Promise<void> {
  await cancelByPrefix('meal_');

  for (const meal of meals) {
    let { hour, minute } = parseTime(meal.time);

    // Schedule 5 minutes before meal time
    minute -= 5;
    if (minute < 0) {
      minute += 60;
      hour = (hour + 23) % 24;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `meal_${meal.id}`,
      content: {
        title: `🍽️ ${meal.name} in 5 minutes`,
        body: meal.foods.map((f) => f.name).join(' · '),
        data: { screen: 'Meals', mealId: meal.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function scheduleWaterReminders(profile: UserProfile): Promise<void> {
  await cancelByPrefix('water_');

  // Every 2 hours between wake+2h and sleep-1h.
  const wake = parseTime(profile.wakeTime).hour;
  const sleep = parseTime(profile.sleepTime).hour;
  const end = sleep > wake ? sleep - 1 : 21;
  const litres = ((profile.waterGoal * 0.25).toFixed(1)).replace(/\.0$/, '');

  for (let hour = wake + 2; hour <= end; hour += 2) {
    await Notifications.scheduleNotificationAsync({
      identifier: `water_${hour}`,
      content: {
        title: '💧 Time to drink water!',
        body: `Stay hydrated — hit your ${litres}L goal today.`,
        data: { screen: 'Water' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}

export async function scheduleWeightReminder(profile: UserProfile): Promise<void> {
  await cancelByPrefix('weight_daily');

  // 15 minutes after wake-up.
  let { hour, minute } = parseTime(profile.wakeTime);
  minute += 15;
  if (minute >= 60) {
    minute -= 60;
    hour = (hour + 1) % 24;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'weight_daily',
    content: {
      title: '⚖️ Morning weigh-in!',
      body: `Log your weight to track progress toward ${profile.goalWeight} kg.`,
      data: { screen: 'Progress' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleExerciseReminder(
  exercisePlan: ExercisePlan,
  profile: UserProfile
): Promise<void> {
  await cancelByPrefix('exercise_');

  const dayMap: Record<number, keyof ExercisePlan> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };

  // 30 minutes after wake-up.
  let { hour, minute } = parseTime(profile.wakeTime);
  minute += 30;
  if (minute >= 60) {
    minute -= 60;
    hour = (hour + 1) % 24;
  }

  for (const [dayNum, dayKey] of Object.entries(dayMap)) {
    const exercise = exercisePlan[dayKey as keyof ExercisePlan];
    if (exercise.isRest) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `exercise_${dayKey}`,
      content: {
        title: `🏃 Time for ${exercise.activity}!`,
        body: `Goal: ${exercise.duration} minutes. You've got this!`,
        data: { screen: 'Exercise' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: parseInt(dayNum, 10) + 1, // expo uses 1=Sun, 7=Sat
        hour,
        minute,
      },
    });
  }
}

export async function scheduleAllNotifications(
  meals: Meal[],
  exercisePlan: ExercisePlan,
  profile: UserProfile
): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Promise.all([
      scheduleMealReminders(meals),
      scheduleWaterReminders(profile),
      scheduleWeightReminder(profile),
      scheduleExerciseReminder(exercisePlan, profile),
    ]);
  } catch (err) {
    // Notifications not supported in this environment (e.g. Expo Go SDK53+)
    console.warn('Could not schedule notifications:', err);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Could not cancel notifications:', err);
  }
}

// In-memory cooldown: keys sent this session, cleared on app restart.
const _smartCooldown = new Set<string>();

/**
 * Context-aware nudges — call whenever the app comes to foreground.
 * Fires at most one notification per key per session.
 */
export async function checkAndSendSmartReminders(
  mealPlan: Meal[],
  log: DayLog | undefined,
  profile: UserProfile
): Promise<void> {
  if (!Device.isDevice) return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  } catch {
    return;
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const send = async (id: string, title: string, body: string, screen: string) => {
    if (_smartCooldown.has(id)) return;
    _smartCooldown.add(id);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title, body, data: { screen } },
        trigger: null, // immediate
      });
    } catch (_) { /* web / Expo Go no-op */ }
  };

  // Meal nudge: meal time passed >30min, still unlogged, within 3-hour window
  for (const meal of mealPlan) {
    const { hour, minute } = parseTime(meal.time);
    const mealMin = hour * 60 + minute;
    const diff = nowMin - mealMin;
    if (diff < 30 || diff > 3 * 60) continue;
    const mealLog = log?.meals.find((m) => m.mealId === meal.id);
    if (mealLog?.logged || mealLog?.skipped) continue;
    await send(
      `smart_meal_${meal.id}`,
      `🍽️ Did you have ${meal.name}?`,
      `Don't forget to log it — every meal counts!`,
      'Meals'
    );
  }

  // Water nudge: after 3 pm, drank less than 50% goal
  if (nowMin >= 15 * 60) {
    const water = log?.water ?? 0;
    if (water < profile.waterGoal / 2) {
      await send(
        'smart_water',
        '💧 You\'re behind on water!',
        `Only ${water} of ${profile.waterGoal} glasses so far. Drink up!`,
        'Water'
      );
    }
  }

  // Exercise nudge: after 7 pm, not exercised and not skipped
  if (nowMin >= 19 * 60) {
    const ex = log?.exercise;
    if (!ex?.done && !ex?.skipped) {
      await send(
        'smart_exercise',
        '🏃 Exercise still pending!',
        'A quick workout now is better than skipping. Let\'s go!',
        'Exercise'
      );
    }
  }
}

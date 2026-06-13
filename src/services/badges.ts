import { DayLog, UserProfile, WeightEntry } from '../types';

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export function computeBadges(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  weightHistory: WeightEntry[],
  streak: number
): Badge[] {
  const totalLost = profile.startWeight - profile.currentWeight;
  const toGoal = profile.startWeight - profile.goalWeight;
  const percentDone = toGoal > 0 ? totalLost / toGoal : 0;

  const logEntries = Object.values(logs);
  const daysWaterMet = logEntries.filter((l) => l.water >= profile.waterGoal).length;
  const daysAllMealsLogged = logEntries.filter(
    (l) => l.meals.length > 0 && l.meals.every((m) => m.logged || m.skipped)
  ).length;
  const daysExercised = logEntries.filter((l) => l.exercise.done).length;
  const daysAnyLog = logEntries.filter(
    (l) => l.meals.some((m) => m.logged) || l.water > 0 || l.exercise.done
  ).length;

  return [
    {
      id: 'first_step',
      emoji: '🌟',
      title: 'First Step',
      description: 'Started your journey',
      earned: true,
    },
    {
      id: 'streak_3',
      emoji: '🔥',
      title: '3-Day Streak',
      description: '3 active days in a row',
      earned: streak >= 3,
    },
    {
      id: 'streak_7',
      emoji: '⚡',
      title: 'Week Warrior',
      description: '7 active days in a row',
      earned: streak >= 7,
    },
    {
      id: 'streak_30',
      emoji: '👑',
      title: 'Month Master',
      description: '30 active days in a row',
      earned: streak >= 30,
    },
    {
      id: 'first_kilo',
      emoji: '💪',
      title: 'First Kilo',
      description: 'Lost your first kilogram',
      earned: totalLost >= 1,
    },
    {
      id: 'halfway',
      emoji: '🎯',
      title: 'Halfway There',
      description: '50% to goal weight',
      earned: percentDone >= 0.5 && toGoal > 0,
    },
    {
      id: 'goal_crusher',
      emoji: '🏆',
      title: 'Goal Crusher',
      description: 'Reached your goal weight!',
      earned: profile.goalWeight > 0 && profile.currentWeight <= profile.goalWeight,
    },
    {
      id: 'hydration_hero',
      emoji: '💧',
      title: 'Hydration Hero',
      description: 'Hit water goal 7+ days',
      earned: daysWaterMet >= 7,
    },
    {
      id: 'meal_tracker',
      emoji: '🍽️',
      title: 'Meal Tracker',
      description: 'Logged all meals in a day',
      earned: daysAllMealsLogged >= 1,
    },
    {
      id: 'exercise_champ',
      emoji: '🏃',
      title: 'Exercise Champ',
      description: 'Exercised 10 times',
      earned: daysExercised >= 10,
    },
    {
      id: 'consistent',
      emoji: '📊',
      title: 'Consistent',
      description: 'Logged activity 14+ days',
      earned: daysAnyLog >= 14,
    },
    {
      id: 'weight_watcher',
      emoji: '⚖️',
      title: 'Weight Watcher',
      description: 'Logged weight 7+ times',
      earned: weightHistory.length >= 7,
    },
  ];
}

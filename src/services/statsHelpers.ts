import dayjs from 'dayjs';
import { DayLog } from '../types';

export const todayStr = () => dayjs().format('YYYY-MM-DD');

export function logKcal(log: DayLog | undefined): number {
  if (!log) return 0;
  const meals = log.meals.filter((m) => m.logged).reduce((s, m) => s + m.totalKcal, 0);
  const quick = (log.quickAdds ?? []).reduce((s, q) => s + q.kcal, 0);
  return Math.round(meals + quick);
}

export function logProtein(log: DayLog | undefined): number {
  if (!log) return 0;
  const meals = log.meals.filter((m) => m.logged).reduce((s, m) => s + m.totalProtein, 0);
  const quick = (log.quickAdds ?? []).reduce((s, q) => s + q.protein, 0);
  return Math.round(meals + quick);
}

export function logCarbs(log: DayLog | undefined): number {
  if (!log) return 0;
  const meals = log.meals
    .filter((m) => m.logged)
    .reduce((s, m) => s + m.foods.reduce((fs, f) => fs + ((f.carbsPer100g ?? 0) * f.grams) / 100, 0), 0);
  const quick = (log.quickAdds ?? []).reduce((s, q) => s + (q.carbs ?? 0), 0);
  return Math.round(meals + quick);
}

export function logFat(log: DayLog | undefined): number {
  if (!log) return 0;
  const meals = log.meals
    .filter((m) => m.logged)
    .reduce((s, m) => s + m.foods.reduce((fs, f) => fs + ((f.fatPer100g ?? 0) * f.grams) / 100, 0), 0);
  const quick = (log.quickAdds ?? []).reduce((s, q) => s + (q.fat ?? 0), 0);
  return Math.round(meals + quick);
}

export function computeTodayTotals(log: DayLog | undefined): {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return {
    kcal: logKcal(log),
    protein: logProtein(log),
    carbs: logCarbs(log),
    fat: logFat(log),
  };
}

export function computeStreak(logs: Record<string, DayLog>, frozenDates: string[] = []): number {
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const log = logs[d];
    const isFrozen = frozenDates.includes(d);
    if (!log && !isFrozen) {
      if (i === 0) continue; // today might not have activity yet
      break;
    }
    const hasActivity =
      isFrozen ||
      log?.meals.some((m) => m.logged) ||
      log?.exercise?.done ||
      (log?.water ?? 0) > 0;
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

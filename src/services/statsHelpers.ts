import dayjs from 'dayjs';
import { DayLog } from '../types';

export const todayStr = () => dayjs().format('YYYY-MM-DD');

export function computeTodayTotals(log: DayLog | undefined): { kcal: number; protein: number } {
  if (!log) return { kcal: 0, protein: 0 };
  const kcal = log.meals.filter((m) => m.logged).reduce((sum, m) => sum + m.totalKcal, 0);
  const protein = log.meals.filter((m) => m.logged).reduce((sum, m) => sum + m.totalProtein, 0);
  return { kcal: Math.round(kcal), protein: Math.round(protein) };
}

export function computeStreak(logs: Record<string, DayLog>): number {
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const log = logs[d];
    if (!log) {
      if (i === 0) continue; // today might not have activity yet
      break;
    }
    const hasActivity =
      log.meals.some((m) => m.logged) || log.exercise.done || log.water > 0;
    if (hasActivity) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

import dayjs from 'dayjs';
import {
  logKcal,
  logProtein,
  logCarbs,
  logFat,
  computeTodayTotals,
  computeStreak,
} from '../../src/services/statsHelpers';
import { DayLog, MealLog, FoodItem } from '../../src/types';

function food(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'f1',
    name: 'Rice',
    grams: 100,
    kcalPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3,
    kcal: 130,
    protein: 2.7,
    ...overrides,
  };
}

function mealLog(overrides: Partial<MealLog> = {}): MealLog {
  return {
    mealId: 'meal_1',
    logged: true,
    skipped: false,
    foods: [food()],
    totalKcal: 130,
    totalProtein: 2.7,
    ...overrides,
  };
}

function dayLog(overrides: Partial<DayLog> = {}): DayLog {
  return {
    date: '2026-07-12',
    meals: [mealLog()],
    water: 0,
    exercise: { done: false, skipped: false },
    ...overrides,
  };
}

describe('logKcal / logProtein', () => {
  it('returns 0 for an undefined log', () => {
    expect(logKcal(undefined)).toBe(0);
    expect(logProtein(undefined)).toBe(0);
  });

  it('sums only logged meals, ignoring unlogged/skipped ones', () => {
    const log = dayLog({
      meals: [mealLog({ logged: true, totalKcal: 400 }), mealLog({ logged: false, totalKcal: 999 })],
    });
    expect(logKcal(log)).toBe(400);
  });

  it('adds quick-add kcal/protein on top of logged meals', () => {
    const log = dayLog({
      meals: [mealLog({ totalKcal: 200, totalProtein: 10 })],
      quickAdds: [{ id: 'q1', kcal: 50, protein: 5, addedAt: '2026-07-12T10:00:00Z' }],
    });
    expect(logKcal(log)).toBe(250);
    expect(logProtein(log)).toBe(15);
  });
});

describe('logCarbs / logFat', () => {
  it('derives carbs/fat from per-100g food values and grams, only for logged meals', () => {
    const log = dayLog({
      meals: [
        mealLog({ foods: [food({ grams: 200, carbsPer100g: 28, fatPer100g: 0.3 })] }),
        mealLog({ logged: false, foods: [food({ grams: 500, carbsPer100g: 100 })] }),
      ],
    });
    expect(logCarbs(log)).toBe(56); // 28 * 200/100
    expect(logFat(log)).toBe(1); // round(0.3 * 200/100) = round(0.6) = 1
  });

  it('treats missing carbsPer100g/fatPer100g as 0', () => {
    const log = dayLog({ meals: [mealLog({ foods: [food({ carbsPer100g: undefined, fatPer100g: undefined })] })] });
    expect(logCarbs(log)).toBe(0);
    expect(logFat(log)).toBe(0);
  });
});

describe('computeTodayTotals', () => {
  it('bundles all four macros for a log', () => {
    const log = dayLog();
    expect(computeTodayTotals(log)).toEqual({
      kcal: logKcal(log),
      protein: logProtein(log),
      carbs: logCarbs(log),
      fat: logFat(log),
    });
  });
});

describe('computeStreak', () => {
  const today = () => dayjs().format('YYYY-MM-DD');
  const daysAgo = (n: number) => dayjs().subtract(n, 'day').format('YYYY-MM-DD');

  it('returns 0 when there is no activity at all', () => {
    expect(computeStreak({})).toBe(0);
  });

  it('counts consecutive days with logged activity, stopping at the first gap', () => {
    const logs: Record<string, DayLog> = {
      [today()]: dayLog({ meals: [mealLog({ logged: true })] }),
      [daysAgo(1)]: dayLog({ meals: [mealLog({ logged: true })] }),
      // gap at daysAgo(2)
      [daysAgo(3)]: dayLog({ meals: [mealLog({ logged: true })] }),
    };
    expect(computeStreak(logs)).toBe(2);
  });

  it('does not break the streak on today if today has no activity yet', () => {
    const logs: Record<string, DayLog> = {
      [daysAgo(1)]: dayLog({ meals: [mealLog({ logged: true })] }),
    };
    expect(computeStreak(logs)).toBe(1);
  });

  it('counts a frozen date as active even with no log', () => {
    const logs: Record<string, DayLog> = {
      [today()]: dayLog({ meals: [mealLog({ logged: true })] }),
      [daysAgo(2)]: dayLog({ meals: [mealLog({ logged: true })] }),
    };
    expect(computeStreak(logs, [daysAgo(1)])).toBe(3);
  });
});

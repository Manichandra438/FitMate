import {
  computeBMR,
  computeTargets,
  computeIfWindow,
  matchesCuisine,
  generatePlan,
} from '../../src/services/planGenerator';
import { MealTemplate, OnboardingAnswers } from '../../src/types';

function baseAnswers(overrides: Partial<OnboardingAnswers> = {}): OnboardingAnswers {
  return {
    name: 'Test User',
    age: 30,
    gender: 'male',
    heightCm: 175,
    currentWeight: 80,
    goalWeight: 70,
    activityLevel: 'moderate',
    dietPref: 'veg',
    mealsPerDay: 3,
    goalPace: 'steady',
    wakeTime: '07:00',
    sleepTime: '23:00',
    waterGoal: 8,
    ...overrides,
  };
}

describe('computeBMR', () => {
  it('applies the male offset (+5) from Mifflin-St Jeor', () => {
    expect(computeBMR(80, 175, 30, 'male')).toBeCloseTo(10 * 80 + 6.25 * 175 - 5 * 30 + 5);
  });

  it('applies the female offset (-161)', () => {
    expect(computeBMR(80, 175, 30, 'female')).toBeCloseTo(10 * 80 + 6.25 * 175 - 5 * 30 - 161);
  });

  it('applies the other/neutral offset (-78)', () => {
    expect(computeBMR(80, 175, 30, 'other')).toBeCloseTo(10 * 80 + 6.25 * 175 - 5 * 30 - 78);
  });
});

describe('computeTargets', () => {
  it('treats a <2kg gap as maintaining — no calorie deficit, no goal date', () => {
    const targets = computeTargets(baseAnswers({ currentWeight: 70, goalWeight: 69 }));
    expect(targets.dailyDelta).toBe(0);
    expect(targets.paceAdjusted).toBe(false);
    expect(targets.goalDate).toBeNull();
  });

  it('clamps the deficit to at most 25% of TDEE for an aggressive cut', () => {
    const targets = computeTargets(
      baseAnswers({ currentWeight: 100, goalWeight: 60, goalPace: 'aggressive' })
    );
    expect(targets.paceAdjusted).toBe(true);
    expect(-targets.dailyDelta).toBeLessThanOrEqual(Math.round(targets.tdee * 0.25) + 1);
  });

  it('never sends calorieGoal below the female intake floor (1200 kcal)', () => {
    const targets = computeTargets(
      baseAnswers({
        gender: 'female',
        currentWeight: 50,
        goalWeight: 40,
        goalPace: 'aggressive',
        heightCm: 150,
        age: 25,
      })
    );
    expect(targets.calorieGoal).toBeGreaterThanOrEqual(1200);
  });

  it('produces a positive dailyDelta and a goalDate when gaining weight', () => {
    const targets = computeTargets(baseAnswers({ currentWeight: 60, goalWeight: 70 }));
    expect(targets.dailyDelta).toBeGreaterThan(0);
    expect(targets.goalDate).not.toBeNull();
  });
});

describe('computeIfWindow', () => {
  it('returns "All day" when protocol is undefined or "none"', () => {
    expect(computeIfWindow(undefined, '07:00', '23:00')).toBe('All day');
    expect(computeIfWindow('none', '07:00', '23:00')).toBe('All day');
  });

  it('offsets the eating window start by the protocol offset from wake time', () => {
    // 16:8 => +1h offset, 8h eating window
    expect(computeIfWindow('16:8', '06:00', '22:00')).toBe('7 AM – 3 PM');
  });

  it('caps the window end at 60 minutes before sleep time', () => {
    // 20:4 => +4h offset, 4h window; wake 05:00 => start 9 AM, natural end 1 PM,
    // but sleep is 13:30 so cap is 12:30
    expect(computeIfWindow('20:4', '05:00', '13:30')).toBe('9 AM – 12:30 PM');
  });
});

describe('matchesCuisine', () => {
  const template = (region?: MealTemplate['cuisineRegion']): MealTemplate => ({
    name: 't',
    slot: 'lunch',
    dietPref: ['veg'],
    cuisineRegion: region,
    foods: [],
  });

  it('matches templates with no cuisineRegion regardless of user preference', () => {
    expect(matchesCuisine(template(undefined), 'south-indian')).toBe(true);
  });

  it('pan-indian user preference only matches pan-indian-tagged templates', () => {
    expect(matchesCuisine(template(['south-indian']), 'pan-indian')).toBe(false);
    expect(matchesCuisine(template(['pan-indian']), 'pan-indian')).toBe(true);
  });

  it('south-indian user preference matches both south-indian and pan-indian templates', () => {
    expect(matchesCuisine(template(['south-indian']), 'south-indian')).toBe(true);
    expect(matchesCuisine(template(['pan-indian']), 'south-indian')).toBe(true);
    expect(matchesCuisine(template(['north-indian']), 'south-indian')).toBe(false);
  });
});

describe('generatePlan', () => {
  it('produces one meal per configured slot with positive totals', () => {
    const { targets, mealPlan } = generatePlan(baseAnswers({ mealsPerDay: 4 }));
    expect(mealPlan).toHaveLength(4);
    mealPlan.forEach((meal) => {
      expect(meal.totalKcal).toBeGreaterThan(0);
      expect(meal.foods.length).toBeGreaterThan(0);
    });
    expect(targets.calorieGoal).toBeGreaterThan(0);
  });
});

import dayjs from 'dayjs';
import {
  ActivityLevel,
  DietPref,
  FoodItem,
  GoalPace,
  Meal,
  MealSlotType,
  MealTemplate,
  MealsPerDay,
  OnboardingAnswers,
  PlanTargets,
  TemplateFood,
} from '../types';
import { MEAL_TEMPLATES } from '../data/mealTemplates';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const PACE_KG_PER_WEEK: Record<GoalPace, number> = {
  gentle: 0.25,
  steady: 0.5,
  aggressive: 0.75,
};

const KCAL_PER_KG = 7700;

export function computeBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  const s = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

export function computeTargets(a: OnboardingAnswers): PlanTargets {
  const bmr = computeBMR(a.currentWeight, a.heightCm, a.age, a.gender);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[a.activityLevel];

  const weightDiff = a.goalWeight - a.currentWeight; // negative = lose
  const maintaining = Math.abs(weightDiff) < 2;

  let dailyDelta = 0;
  let paceAdjusted = false;

  if (!maintaining) {
    const requested = (PACE_KG_PER_WEEK[a.goalPace] * KCAL_PER_KG) / 7;
    dailyDelta = weightDiff < 0 ? -requested : requested;

    if (dailyDelta < 0) {
      // Clamp deficit: max 25% of TDEE, and floor on absolute intake.
      const maxDeficit = tdee * 0.25;
      if (-dailyDelta > maxDeficit) {
        dailyDelta = -maxDeficit;
        paceAdjusted = true;
      }
      const floor = Math.max(bmr * 0.9, a.gender === 'female' ? 1200 : 1500);
      if (tdee + dailyDelta < floor) {
        dailyDelta = floor - tdee;
        paceAdjusted = true;
      }
    }
  }

  const calorieGoal = Math.round(tdee + dailyDelta);

  // Protein: cutting uses an adjusted reference weight; gaining uses current.
  let proteinGoal: number;
  if (weightDiff < 0) {
    const refWeight = Math.min(
      a.currentWeight,
      a.goalWeight + 0.25 * (a.currentWeight - a.goalWeight)
    );
    proteinGoal = 1.8 * refWeight;
  } else {
    proteinGoal = 1.6 * a.currentWeight;
  }
  proteinGoal = Math.round(Math.min(Math.max(proteinGoal, 90), 200));

  const waterGoal = Math.min(
    Math.max(Math.round((a.currentWeight * 0.035) / 0.25), 6),
    16
  );

  let goalDate: string | null = null;
  if (!maintaining && dailyDelta !== 0) {
    const kgPerDay = Math.abs(dailyDelta) / KCAL_PER_KG;
    const days = Math.ceil(Math.abs(weightDiff) / kgPerDay);
    goalDate = dayjs().add(days, 'day').format('YYYY-MM-DD');
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal,
    proteinGoal,
    waterGoal,
    dailyDelta: Math.round(dailyDelta),
    paceAdjusted,
    goalDate,
  };
}

interface MealSlot {
  name: string;
  slot: MealSlotType;
  sharePct: number;
}

const MEAL_SPLITS: Record<MealsPerDay, MealSlot[]> = {
  3: [
    { name: 'Breakfast', slot: 'breakfast', sharePct: 30 },
    { name: 'Lunch', slot: 'lunch', sharePct: 40 },
    { name: 'Dinner', slot: 'dinner', sharePct: 30 },
  ],
  4: [
    { name: 'Breakfast', slot: 'breakfast', sharePct: 25 },
    { name: 'Lunch', slot: 'lunch', sharePct: 35 },
    { name: 'Evening Snack', slot: 'snack', sharePct: 10 },
    { name: 'Dinner', slot: 'dinner', sharePct: 30 },
  ],
  5: [
    { name: 'Breakfast', slot: 'breakfast', sharePct: 25 },
    { name: 'Morning Snack', slot: 'snack', sharePct: 10 },
    { name: 'Lunch', slot: 'lunch', sharePct: 30 },
    { name: 'Evening Snack', slot: 'snack', sharePct: 10 },
    { name: 'Dinner', slot: 'dinner', sharePct: 25 },
  ],
  6: [
    { name: 'Breakfast', slot: 'breakfast', sharePct: 22 },
    { name: 'Morning Snack', slot: 'snack', sharePct: 8 },
    { name: 'Lunch', slot: 'lunch', sharePct: 28 },
    { name: 'Afternoon Snack', slot: 'snack', sharePct: 8 },
    { name: 'Evening Snack', slot: 'snack', sharePct: 12 },
    { name: 'Dinner', slot: 'dinner', sharePct: 22 },
  ],
};

function parseTime(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const clamped = ((Math.round(minutes / 15) * 15) % (24 * 60) + 24 * 60) % (24 * 60);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mealTimes(count: number, wakeTime: string, sleepTime: string): string[] {
  let start = parseTime(wakeTime) + 60;
  let end = parseTime(sleepTime) - 90;
  if (end <= start) end = start + (count - 1) * 150; // degenerate inputs fallback
  const step = count > 1 ? (end - start) / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => formatTime(start + step * i));
}

function templateFoodKcal(f: TemplateFood, grams: number): number {
  return (f.kcalPer100g * grams) / 100;
}

function buildFoods(
  template: MealTemplate,
  targetKcal: number,
  mealIndex: number
): FoodItem[] {
  // Start from base grams, then scale the scalable items uniformly toward the
  // slot's kcal target, respecting per-food max portions.
  const grams = template.foods.map((f) => f.baseGrams);

  const fixedKcal = template.foods
    .filter((f) => !f.scalable)
    .reduce((s, f) => s + templateFoodKcal(f, f.baseGrams), 0);
  const baseScalableKcal = template.foods
    .filter((f) => f.scalable)
    .reduce((s, f) => s + templateFoodKcal(f, f.baseGrams), 0);

  if (baseScalableKcal > 0) {
    const factor = Math.max((targetKcal - fixedKcal) / baseScalableKcal, 0.4);
    template.foods.forEach((f, i) => {
      if (!f.scalable) return;
      let g = f.baseGrams * factor;
      if (f.maxGrams) g = Math.min(g, f.maxGrams);
      grams[i] = Math.round(g / 5) * 5;
    });
  }

  return template.foods.map((f, i) => {
    const g = grams[i];
    return {
      id: `gm${mealIndex}f${i + 1}`,
      name: f.name,
      grams: g,
      kcalPer100g: f.kcalPer100g,
      proteinPer100g: f.proteinPer100g,
      kcal: Math.round((f.kcalPer100g * g) / 100),
      protein: Math.round(((f.proteinPer100g * g) / 100) * 10) / 10,
    };
  });
}

export function generateMealPlan(
  answers: OnboardingAnswers,
  targets: PlanTargets
): Meal[] {
  const slots = MEAL_SPLITS[answers.mealsPerDay];
  const times = mealTimes(slots.length, answers.wakeTime, answers.sleepTime);

  const usedTemplates = new Set<string>();
  const chosenTemplates: MealTemplate[] = [];

  const meals: Meal[] = slots.map((slot, i) => {
    const candidates = MEAL_TEMPLATES.filter(
      (t) => t.slot === slot.slot && t.dietPref.includes(answers.dietPref)
    );
    // Prefer an unused template so repeated snack slots vary.
    const template =
      candidates.find((t) => !usedTemplates.has(t.name)) ?? candidates[0];
    usedTemplates.add(template.name);
    chosenTemplates[i] = template;

    const targetKcal = (targets.calorieGoal * slot.sharePct) / 100;
    const foods = buildFoods(template, targetKcal, i + 1);

    return {
      id: `meal_${i + 1}`,
      name: slot.name,
      time: times[i],
      foods,
      totalKcal: Math.round(foods.reduce((s, f) => s + f.kcal, 0)),
      totalProtein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    };
  });

  // Protein top-up: scale the densest-protein scalable food across meals until
  // the daily protein target is met or portions hit their caps.
  let totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
  if (totalProtein < targets.proteinGoal) {
    for (let mi = 0; mi < meals.length; mi++) {
      if (totalProtein >= targets.proteinGoal) break;
      const meal = meals[mi];
      const template = chosenTemplates[mi];

      let bestIdx = -1;
      let bestDensity = 0;
      meal.foods.forEach((f, idx) => {
        const tf = template?.foods[idx];
        if (tf?.scalable && f.proteinPer100g > bestDensity) {
          bestDensity = f.proteinPer100g;
          bestIdx = idx;
        }
      });
      if (bestIdx < 0) continue;

      const f = meal.foods[bestIdx];
      const tf = template.foods[bestIdx];
      const cap = tf.maxGrams ?? f.grams * 2;
      const extraGrams = Math.min(
        ((targets.proteinGoal - totalProtein) / f.proteinPer100g) * 100,
        cap - f.grams
      );
      if (extraGrams <= 0) continue;

      const g = Math.round((f.grams + extraGrams) / 5) * 5;
      const updated = {
        ...f,
        grams: g,
        kcal: Math.round((f.kcalPer100g * g) / 100),
        protein: Math.round(((f.proteinPer100g * g) / 100) * 10) / 10,
      };
      totalProtein += updated.protein - f.protein;
      meal.foods[bestIdx] = updated;
      meal.totalKcal = Math.round(meal.foods.reduce((s, x) => s + x.kcal, 0));
      meal.totalProtein =
        Math.round(meal.foods.reduce((s, x) => s + x.protein, 0) * 10) / 10;
    }
  }

  return meals;
}

export function generatePlan(answers: OnboardingAnswers): {
  targets: PlanTargets;
  mealPlan: Meal[];
} {
  const targets = computeTargets(answers);
  const mealPlan = generateMealPlan(answers, targets);
  return { targets, mealPlan };
}

/** Replace a meal's foods with a different template, keeping the same calorie target. */
export function swapMealTemplate(originalMeal: Meal, template: MealTemplate): Meal {
  const foods = buildFoods(template, originalMeal.totalKcal, 0);
  return {
    ...originalMeal,
    foods,
    totalKcal: Math.round(foods.reduce((s, f) => s + f.kcal, 0)),
    totalProtein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
  };
}

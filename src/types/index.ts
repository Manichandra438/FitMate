import { colors } from '../theme';

export interface FoodItem {
  id: string;
  name: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  kcal: number;
  protein: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string; // "08:00"
  foods: FoodItem[];
  totalKcal: number;
  totalProtein: number;
}

export interface MealLog {
  mealId: string;
  logged: boolean;
  skipped: boolean;
  foods: FoodItem[];
  totalKcal: number;
  totalProtein: number;
  loggedAt?: string;
}

export interface ExerciseLog {
  done: boolean;
  skipped: boolean;
  duration?: number;
  activityName?: string;
}

export interface DayLog {
  date: string;
  wakeUpTime?: string;
  meals: MealLog[];
  water: number;
  exercise: ExerciseLog;
  weight?: number;
}

export interface DayExercise {
  activity: string;
  duration: number;
  isRest: boolean;
}

export interface ExercisePlan {
  mon: DayExercise;
  tue: DayExercise;
  wed: DayExercise;
  thu: DayExercise;
  fri: DayExercise;
  sat: DayExercise;
  sun: DayExercise;
}

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type DietPref = 'veg' | 'eggetarian' | 'nonveg';
export type GoalPace = 'gentle' | 'steady' | 'aggressive';
export type MealsPerDay = 3 | 4 | 5 | 6;

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  startWeight: number;
  goalWeight: number;
  currentWeight: number;
  startDate: string;
  activityLevel: ActivityLevel;
  dietPref: DietPref;
  mealsPerDay: MealsPerDay;
  goalPace: GoalPace;
  calorieGoal: number;
  proteinGoal: number;
  waterGoal: number;
  wakeTime: string; // "07:00"
  sleepTime: string; // "23:00"
  onboarded: boolean;
  goalDate?: string; // user-chosen target date YYYY-MM-DD
  favouriteFoods?: string[]; // food names starred by user
}

export interface OnboardingAnswers {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  currentWeight: number;
  goalWeight: number;
  activityLevel: ActivityLevel;
  dietPref: DietPref;
  mealsPerDay: MealsPerDay;
  goalPace: GoalPace;
  wakeTime: string;
  sleepTime: string;
  waterGoal: number;
  goalDate?: string; // user-chosen target date YYYY-MM-DD
}

export interface PlanTargets {
  bmr: number;
  tdee: number;
  calorieGoal: number;
  proteinGoal: number;
  waterGoal: number;
  dailyDelta: number; // signed kcal delta applied to TDEE
  paceAdjusted: boolean; // true when clamps modified the requested pace
  goalDate: string | null; // projected YYYY-MM-DD, null when maintaining
}

export type MealSlotType = 'breakfast' | 'snack' | 'lunch' | 'dinner';

export interface TemplateFood {
  name: string;
  baseGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  scalable: boolean;
  maxGrams?: number;
}

export interface MealTemplate {
  name: string;
  slot: MealSlotType;
  dietPref: DietPref[];
  foods: TemplateFood[];
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface NutritionixFood {
  food_name: string;
  nf_calories: number;
  nf_protein: number;
  serving_weight_grams: number;
  photo?: { thumb: string };
  tag_id?: string;
}

/** @deprecated Use `colors` from src/theme instead. */
export const COLORS = {
  bg: colors.bg,
  card: colors.surface,
  border: colors.border,
  green: colors.green,
  greenDark: colors.greenDark,
  greenBg: colors.greenBg,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  orange: colors.orange,
  blue: colors.blue,
  red: colors.red,
  yellow: colors.yellow,
} as const;

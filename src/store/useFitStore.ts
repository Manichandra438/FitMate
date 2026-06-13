import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { DEFAULT_EXERCISE_PLAN } from '../data/exercisePlan';
import { generatePlan } from '../services/planGenerator';
import { computeStreak, computeTodayTotals, todayStr } from '../services/statsHelpers';
import {
  DayLog,
  ExercisePlan,
  Meal,
  MealLog,
  OnboardingAnswers,
  PlanTargets,
  UserProfile,
  WeightEntry,
} from '../types';

const currentDayKey = () => dayjs().format('ddd').toLowerCase() as keyof ExercisePlan;

const defaultMealLog = (meal: Meal): MealLog => ({
  mealId: meal.id,
  logged: false,
  skipped: false,
  foods: meal.foods,
  totalKcal: meal.totalKcal,
  totalProtein: meal.totalProtein,
});

const buildDefaultDayLog = (meals: Meal[]): DayLog => ({
  date: todayStr(),
  wakeUpTime: undefined,
  meals: meals.map(defaultMealLog),
  water: 0,
  exercise: { done: false, skipped: false },
  weight: undefined,
});

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 25,
  gender: 'male',
  heightCm: 170,
  startWeight: 0,
  goalWeight: 0,
  currentWeight: 0,
  startDate: todayStr(),
  activityLevel: 'light',
  dietPref: 'nonveg',
  mealsPerDay: 4,
  goalPace: 'steady',
  calorieGoal: 1800,
  proteinGoal: 120,
  waterGoal: 8,
  wakeTime: '07:00',
  sleepTime: '23:00',
  onboarded: false,
};

export interface CloudPayload {
  profile: UserProfile;
  mealPlan: Meal[];
  exercisePlan: ExercisePlan;
  weightHistory: WeightEntry[];
  logs: Record<string, DayLog>;
}

interface FitState {
  profile: UserProfile;
  logs: Record<string, DayLog>;
  weightHistory: WeightEntry[];
  mealPlan: Meal[];
  exercisePlan: ExercisePlan;

  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (answers: OnboardingAnswers) => PlanTargets;
  hydrateFromCloud: (payload: Partial<CloudPayload>) => void;
  resetAll: () => void;
  logWakeUp: () => void;
  logMeal: (mealId: string, kcal: number, protein: number) => void;
  skipMeal: (mealId: string) => void;
  unlogMeal: (mealId: string) => void;
  addWater: () => void;
  removeWater: () => void;
  logExercise: (duration: number) => void;
  skipExercise: () => void;
  logWeight: (weight: number) => void;
  updateMealPlan: (meals: Meal[]) => void;
  updateSingleMeal: (mealId: string, updated: Meal) => void;
  updateExercisePlan: (plan: ExercisePlan) => void;
  toggleFavourite: (foodName: string) => void;
  ensureTodayLog: () => void;
  getTodayLog: () => DayLog;
  getStreak: () => number;
  getTodayTotals: () => { kcal: number; protein: number };
}

export const useFitStore = create<FitState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      logs: {},
      weightHistory: [],
      mealPlan: [],
      exercisePlan: DEFAULT_EXERCISE_PLAN,

      setProfile: (profile) =>
        set((s) => ({ profile: { ...s.profile, ...profile } })),

      completeOnboarding: (answers) => {
        const { targets, mealPlan } = generatePlan(answers);
        set((s) => ({
          profile: {
            ...s.profile,
            name: answers.name,
            age: answers.age,
            gender: answers.gender,
            heightCm: answers.heightCm,
            startWeight: answers.currentWeight,
            currentWeight: answers.currentWeight,
            goalWeight: answers.goalWeight,
            startDate: todayStr(),
            activityLevel: answers.activityLevel,
            dietPref: answers.dietPref,
            mealsPerDay: answers.mealsPerDay,
            goalPace: answers.goalPace,
            calorieGoal: targets.calorieGoal,
            proteinGoal: targets.proteinGoal,
            waterGoal: answers.waterGoal,
            wakeTime: answers.wakeTime,
            sleepTime: answers.sleepTime,
            goalDate: answers.goalDate ?? targets.goalDate ?? undefined,
            fastingProtocol: answers.fastingProtocol ?? 'none',
            onboarded: true,
          },
          mealPlan,
          logs: {
            ...s.logs,
            [todayStr()]: buildDefaultDayLog(mealPlan),
          },
          weightHistory: [
            ...s.weightHistory.filter((w) => w.date !== todayStr()),
            { date: todayStr(), weight: answers.currentWeight },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        }));
        return targets;
      },

      hydrateFromCloud: (payload) =>
        set((s) => ({
          profile: payload.profile ?? s.profile,
          mealPlan: payload.mealPlan ?? s.mealPlan,
          exercisePlan: payload.exercisePlan ?? s.exercisePlan,
          weightHistory: payload.weightHistory ?? s.weightHistory,
          logs: payload.logs ? { ...s.logs, ...payload.logs } : s.logs,
        })),

      resetAll: () =>
        set({
          profile: { ...DEFAULT_PROFILE, startDate: todayStr() },
          logs: {},
          weightHistory: [],
          mealPlan: [],
          exercisePlan: DEFAULT_EXERCISE_PLAN,
        }),

      ensureTodayLog: () => {
        const date = todayStr();
        const { logs, mealPlan } = get();
        if (!logs[date]) {
          set((s) => ({
            logs: {
              ...s.logs,
              [date]: buildDefaultDayLog(mealPlan),
            },
          }));
        }
      },

      logWakeUp: () => {
        const date = todayStr();
        get().ensureTodayLog();
        const log = get().logs[date];
        if (!log.wakeUpTime) {
          set((s) => ({
            logs: {
              ...s.logs,
              [date]: { ...s.logs[date], wakeUpTime: dayjs().format('h:mm A') },
            },
          }));
        }
      },

      logMeal: (mealId, kcal, protein) => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              meals: s.logs[date].meals.map((m) =>
                m.mealId === mealId
                  ? {
                      ...m,
                      logged: true,
                      skipped: false,
                      totalKcal: kcal,
                      totalProtein: protein,
                      loggedAt: dayjs().format('h:mm A'),
                    }
                  : m
              ),
            },
          },
        }));
      },

      skipMeal: (mealId) => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              meals: s.logs[date].meals.map((m) =>
                m.mealId === mealId
                  ? { ...m, skipped: true, logged: false }
                  : m
              ),
            },
          },
        }));
      },

      unlogMeal: (mealId) => {
        const date = todayStr();
        get().ensureTodayLog();
        const planMeal = get().mealPlan.find((m) => m.id === mealId);
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              meals: s.logs[date].meals.map((m) =>
                m.mealId === mealId
                  ? {
                      ...m,
                      logged: false,
                      skipped: false,
                      totalKcal: planMeal?.totalKcal ?? m.totalKcal,
                      totalProtein: planMeal?.totalProtein ?? m.totalProtein,
                      loggedAt: undefined,
                    }
                  : m
              ),
            },
          },
        }));
      },

      addWater: () => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              water: Math.min(
                (s.logs[date]?.water ?? 0) + 1,
                s.profile.waterGoal
              ),
            },
          },
        }));
      },

      removeWater: () => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              water: Math.max((s.logs[date]?.water ?? 0) - 1, 0),
            },
          },
        }));
      },

      logExercise: (duration) => {
        const date = todayStr();
        const dayKey = currentDayKey();
        const exercise = get().exercisePlan[dayKey];
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              exercise: {
                done: true,
                skipped: false,
                duration,
                activityName: exercise.activity,
              },
            },
          },
        }));
      },

      skipExercise: () => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: {
              ...s.logs[date],
              exercise: { done: false, skipped: true },
            },
          },
        }));
      },

      logWeight: (weight) => {
        const date = todayStr();
        get().ensureTodayLog();
        set((s) => {
          const filtered = s.weightHistory.filter((w) => w.date !== date);
          const newHistory = [...filtered, { date, weight }].sort((a, b) =>
            a.date.localeCompare(b.date)
          );
          return {
            logs: {
              ...s.logs,
              [date]: { ...s.logs[date], weight },
            },
            weightHistory: newHistory,
            profile: { ...s.profile, currentWeight: weight },
          };
        });
      },

      updateMealPlan: (meals) => set({ mealPlan: meals }),
      updateSingleMeal: (mealId, updated) =>
        set((s) => {
          const today = todayStr();
          const newMealPlan = s.mealPlan.map((m) => (m.id === mealId ? updated : m));
          const todayLog = s.logs[today];
          if (!todayLog) return { mealPlan: newMealPlan };
          const newMeals = todayLog.meals.map((m) => {
            if (m.mealId !== mealId || m.logged || m.skipped) return m;
            return { ...m, foods: updated.foods, totalKcal: updated.totalKcal, totalProtein: updated.totalProtein };
          });
          return { mealPlan: newMealPlan, logs: { ...s.logs, [today]: { ...todayLog, meals: newMeals } } };
        }),
      updateExercisePlan: (plan) => set({ exercisePlan: plan }),
      toggleFavourite: (foodName) =>
        set((s) => {
          const favs = s.profile.favouriteFoods ?? [];
          return {
            profile: {
              ...s.profile,
              favouriteFoods: favs.includes(foodName) ? favs.filter((f) => f !== foodName) : [...favs, foodName],
            },
          };
        }),

      getTodayLog: () => {
        const date = todayStr();
        const { logs, mealPlan } = get();
        return logs[date] ?? buildDefaultDayLog(mealPlan);
      },

      getTodayTotals: () => computeTodayTotals(get().logs[todayStr()]),

      getStreak: () => computeStreak(get().logs),
    }),
    {
      name: 'fitmate-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: any, version) => {
        if (version < 2 && persisted) {
          // v1 → v2: keep logs/weightHistory/plans; extend the profile and
          // route everyone through onboarding once so targets get computed.
          persisted.profile = {
            ...DEFAULT_PROFILE,
            ...persisted.profile,
            onboarded: false,
          };
        }
        return persisted;
      },
    }
  )
);

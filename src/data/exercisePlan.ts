import { ExercisePlan } from '../types';

export const DEFAULT_EXERCISE_PLAN: ExercisePlan = {
  mon: { activity: 'Walk', duration: 30, isRest: false },
  tue: { activity: 'Stretching', duration: 20, isRest: false },
  wed: { activity: 'Stair Climbing', duration: 20, isRest: false },
  thu: { activity: 'Walk', duration: 30, isRest: false },
  fri: { activity: 'Stretching + Core', duration: 25, isRest: false },
  sat: { activity: 'Walk', duration: 45, isRest: false },
  sun: { activity: 'Rest Day', duration: 0, isRest: true },
};

export const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

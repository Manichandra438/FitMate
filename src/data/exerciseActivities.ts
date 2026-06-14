export interface ActivityDef {
  name: string;
  emoji: string;
  met: number;
}

export const ACTIVITIES: ActivityDef[] = [
  { name: 'Running', emoji: '🏃', met: 8.0 },
  { name: 'Gym / Weights', emoji: '🏋️', met: 5.0 },
  { name: 'Cycling', emoji: '🚴', met: 7.5 },
  { name: 'Yoga', emoji: '🧘', met: 3.0 },
  { name: 'Swimming', emoji: '🏊', met: 7.0 },
  { name: 'Sport', emoji: '⚽', met: 7.0 },
  { name: 'Home Workout', emoji: '🏠', met: 4.5 },
  { name: 'Walking', emoji: '🚶', met: 3.5 },
  { name: 'HIIT', emoji: '🔥', met: 8.5 },
  { name: 'Dance', emoji: '💃', met: 5.0 },
  { name: 'Other', emoji: '✏️', met: 4.0 },
];

// Standard MET formula: kcal = MET × weight_kg × (duration_min / 60)
export function calcKcal(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import dayjs from 'dayjs';
import { useFitStore } from '../store/useFitStore';

async function shareFile(filename: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: 'Export FitMate data',
  });
}

export async function exportJSON(): Promise<void> {
  const { profile, mealPlan, exercisePlan, weightHistory, logs } =
    useFitStore.getState();
  const payload = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    profile,
    mealPlan,
    exercisePlan,
    weightHistory,
    logs,
  };
  await shareFile(
    `fitmate-export-${dayjs().format('YYYY-MM-DD')}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

const csvEscape = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCSV(): Promise<void> {
  const { logs, weightHistory } = useFitStore.getState();

  const rows: string[] = [
    'date,calories_kcal,protein_g,water_glasses,meals_logged,meals_skipped,exercise_done,exercise_minutes,weight_kg,wake_time',
  ];
  for (const date of Object.keys(logs).sort()) {
    const log = logs[date];
    const kcal = log.meals.filter((m) => m.logged).reduce((s, m) => s + m.totalKcal, 0);
    const protein = log.meals.filter((m) => m.logged).reduce((s, m) => s + m.totalProtein, 0);
    rows.push(
      [
        date,
        Math.round(kcal),
        Math.round(protein),
        log.water,
        log.meals.filter((m) => m.logged).length,
        log.meals.filter((m) => m.skipped).length,
        log.exercise.done ? 'yes' : 'no',
        log.exercise.duration ?? '',
        log.weight ?? '',
        log.wakeUpTime ?? '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  await shareFile(
    `fitmate-daily-${dayjs().format('YYYY-MM-DD')}.csv`,
    rows.join('\n'),
    'text/csv'
  );

  const weightRows = ['date,weight_kg'];
  for (const w of weightHistory) {
    weightRows.push(`${w.date},${w.weight}`);
  }
  await shareFile(
    `fitmate-weights-${dayjs().format('YYYY-MM-DD')}.csv`,
    weightRows.join('\n'),
    'text/csv'
  );
}

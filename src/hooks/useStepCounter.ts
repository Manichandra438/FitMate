import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import dayjs from 'dayjs';

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let sub: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    Pedometer.isAvailableAsync().then((ok) => {
      setAvailable(ok);
      if (!ok) return;

      const startOfDay = dayjs().startOf('day').toDate();
      const now = new Date();
      Pedometer.getStepCountAsync(startOfDay, now)
        .then((r) => setSteps(r.steps))
        .catch(() => {});

      sub = Pedometer.watchStepCount((r) => setSteps(r.steps));
    });

    return () => { sub?.remove(); };
  }, []);

  const kcalBurned = Math.round(steps * 0.04);

  return { steps, available, kcalBurned };
}

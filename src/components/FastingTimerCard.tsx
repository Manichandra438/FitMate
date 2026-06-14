import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { colors, radius, spacing, cardShadow } from '../theme';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
}

function parseFastHours(protocol: string): { fastHours: number; eatHours: number } | null {
  const match = protocol.match(/^(\d+):(\d+)$/);
  if (!match) return null;
  return { fastHours: parseInt(match[1]), eatHours: parseInt(match[2]) };
}

function formatCountdown(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function FastingTimerCard({ profile }: Props) {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!profile.fastingProtocol || profile.fastingProtocol === 'none') return null;

  const parsed = parseFastHours(profile.fastingProtocol);
  if (!parsed) return null;

  const { eatHours } = parsed;
  const [wakeH, wakeM] = (profile.wakeTime ?? '07:00').split(':').map(Number);

  const eatStart = dayjs().hour(wakeH).minute(wakeM).second(0).millisecond(0);
  const eatEnd = eatStart.add(eatHours, 'hour');

  const isEating = now.valueOf() >= eatStart.valueOf() && now.valueOf() < eatEnd.valueOf();

  let minutesLeft: number;
  let status: 'eating' | 'fasting';

  if (isEating) {
    status = 'eating';
    minutesLeft = eatEnd.diff(now, 'minute');
  } else {
    status = 'fasting';
    const nextEatStart = now.valueOf() < eatStart.valueOf()
      ? eatStart
      : eatStart.add(1, 'day');
    minutesLeft = nextEatStart.diff(now, 'minute');
  }

  const countdown = formatCountdown(Math.max(minutesLeft, 0));

  return (
    <View style={[styles.card, status === 'eating' ? styles.cardEating : styles.cardFasting, cardShadow]}>
      <Text style={styles.emoji}>{status === 'eating' ? '🍽️' : '⏳'}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={[styles.statusText, status === 'eating' ? styles.eatColor : styles.fastColor]}>
            {status === 'eating' ? 'Eating window' : 'Fasting'}
          </Text>
          <View style={[styles.protocolBadge, status === 'eating' ? styles.badgeEat : styles.badgeFast]}>
            <Text style={[styles.protocolText, status === 'eating' ? styles.eatColor : styles.fastColor]}>
              {profile.fastingProtocol}
            </Text>
          </View>
        </View>
        <Text style={styles.countdown}>
          {status === 'eating' ? 'Closes in ' : 'Opens in '}
          <Text style={[styles.countdownTime, status === 'eating' ? styles.eatColor : styles.fastColor]}>
            {countdown}
          </Text>
        </Text>
        <Text style={styles.window}>
          {eatStart.format('h:mm A')} – {eatEnd.format('h:mm A')} eating
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardEating: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint,
  },
  cardFasting: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  emoji: { fontSize: 26 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  statusText: { fontSize: 14, fontWeight: '700' },
  eatColor: { color: colors.mint },
  fastColor: { color: colors.sky },
  protocolBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeEat: { backgroundColor: colors.mintSoft, borderColor: colors.mint },
  badgeFast: { backgroundColor: colors.skySoft, borderColor: colors.sky },
  protocolText: { fontSize: 11, fontWeight: '700' },
  countdown: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  countdownTime: { fontWeight: '800' },
  window: { fontSize: 11, color: colors.textMuted },
});

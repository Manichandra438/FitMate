import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, radius, spacing, cardShadow } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { logKcal, logProtein } from '../services/statsHelpers';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function getWeekData() {
  const store = useFitStore.getState();
  const { profile, logs, weightHistory } = store;

  const days: {
    date: string;
    label: string;
    kcal: number;
    protein: number;
    water: number;
    mealsDone: number;
    mealsTotal: number;
    exercised: boolean;
    waterMet: boolean;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const log = logs[date];
    days.push({
      date,
      label: dayjs(date).format('ddd'),
      kcal: logKcal(log),
      protein: logProtein(log),
      water: log?.water ?? 0,
      mealsDone: log?.meals.filter((m) => m.logged).length ?? 0,
      mealsTotal: log?.meals.length ?? 0,
      exercised: log?.exercise.done ?? false,
      waterMet: (log?.water ?? 0) >= profile.waterGoal,
    });
  }

  const activeDays = days.filter((d) => d.kcal > 0 || d.water > 0 || d.exercised);
  // Calorie/protein averages divide only by days food was actually logged —
  // water-only or exercise-only days would otherwise drag the average down.
  const ateDays = days.filter((d) => d.kcal > 0);
  const avgKcal = ateDays.length
    ? Math.round(ateDays.reduce((s, d) => s + d.kcal, 0) / ateDays.length)
    : 0;
  const avgProtein = ateDays.length
    ? Math.round(ateDays.reduce((s, d) => s + d.protein, 0) / ateDays.length)
    : 0;
  const avgWater = activeDays.length
    ? Math.round((activeDays.reduce((s, d) => s + d.water, 0) / activeDays.length) * 10) / 10
    : 0;

  const weekWeights = weightHistory
    .filter((w) => dayjs(w.date).isAfter(dayjs().subtract(8, 'day')))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightChange =
    weekWeights.length >= 2
      ? +(weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight).toFixed(1)
      : null;

  const daysExercised = days.filter((d) => d.exercised).length;
  const daysWaterMet = days.filter((d) => d.waterMet).length;
  const bestDay = [...activeDays].sort(
    (a, b) => b.mealsDone + (b.exercised ? 2 : 0) + (b.waterMet ? 1 : 0)
      - (a.mealsDone + (a.exercised ? 2 : 0) + (a.waterMet ? 1 : 0))
  )[0];

  return {
    days, activeDays, avgKcal, avgProtein, avgWater,
    weightChange, daysExercised, daysWaterMet, bestDay,
    calorieGoal: profile.calorieGoal,
    proteinGoal: profile.proteinGoal,
    waterGoal: profile.waterGoal,
  };
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={[styles.statCard, cardShadow]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

export default function WeeklyReportModal({ visible, onClose }: Props) {
  if (!visible) return null;
  const d = getWeekData();

  const kcalPct = d.calorieGoal ? Math.round((d.avgKcal / d.calorieGoal) * 100) : 0;
  const proteinPct = d.proteinGoal ? Math.round((d.avgProtein / d.proteinGoal) * 100) : 0;

  const weekStart = dayjs().subtract(6, 'day').format('MMM D');
  const weekEnd = dayjs().format('MMM D');

  let motivation = 'Keep going, every day counts!';
  if (d.activeDays.length === 7) motivation = 'Perfect week! Absolutely crushing it 🔥';
  else if (d.activeDays.length >= 5) motivation = 'Strong week! Consistency is your superpower.';
  else if (d.activeDays.length >= 3) motivation = 'Decent effort — aim for one more day next week.';
  else motivation = 'Tough week, but you showed up. That matters!';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Weekly Report</Text>
              <Text style={styles.subtitle}>{weekStart} – {weekEnd}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Stat cards */}
            <View style={styles.statRow}>
              <StatCard
                label="Avg Calories" value={`${d.avgKcal}`} sub={`${kcalPct}% of goal`}
                color={kcalPct >= 80 && kcalPct <= 110 ? colors.mint : colors.orange}
              />
              <StatCard
                label="Avg Protein" value={`${d.avgProtein}g`} sub={`${proteinPct}% of goal`}
                color={proteinPct >= 80 ? colors.mint : colors.orange}
              />
              <StatCard
                label="Avg Water" value={`${d.avgWater}`} sub="glasses/day"
                color={colors.sky}
              />
            </View>

            {/* Weight change */}
            {d.weightChange !== null && (
              <View style={[styles.weightRow, cardShadow]}>
                <Ionicons
                  name={d.weightChange <= 0 ? 'trending-down' : 'trending-up'}
                  size={22}
                  color={d.weightChange <= 0 ? colors.mint : colors.orange}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.weightLabel}>Weight this week</Text>
                  <Text style={[styles.weightValue, { color: d.weightChange <= 0 ? colors.mint : colors.orange }]}>
                    {d.weightChange > 0 ? '+' : ''}{d.weightChange} kg
                  </Text>
                </View>
              </View>
            )}

            {/* Day grid */}
            <Text style={styles.sectionLabel}>Daily overview</Text>
            <View style={styles.dayGrid}>
              {d.days.map((day) => {
                const active = day.kcal > 0 || day.water > 0 || day.exercised;
                return (
                  <View key={day.date} style={[styles.dayCell, active && styles.dayCellActive]}>
                    <Text style={[styles.dayLabel, active && { color: colors.primary }]}>{day.label}</Text>
                    {day.exercised && <Text style={styles.dayIcon}>💪</Text>}
                    {day.waterMet && <Text style={styles.dayIcon}>💧</Text>}
                    {!active && <Text style={styles.dayIcon}>—</Text>}
                  </View>
                );
              })}
            </View>

            {/* Achievements row */}
            <View style={styles.achRow}>
              <View style={styles.achItem}>
                <Text style={styles.achNum}>{d.activeDays.length}<Text style={styles.achOf}>/7</Text></Text>
                <Text style={styles.achLabel}>Active days</Text>
              </View>
              <View style={styles.achDivider} />
              <View style={styles.achItem}>
                <Text style={styles.achNum}>{d.daysExercised}<Text style={styles.achOf}>/7</Text></Text>
                <Text style={styles.achLabel}>Exercised</Text>
              </View>
              <View style={styles.achDivider} />
              <View style={styles.achItem}>
                <Text style={styles.achNum}>{d.daysWaterMet}<Text style={styles.achOf}>/7</Text></Text>
                <Text style={styles.achLabel}>Water goal</Text>
              </View>
            </View>

            {/* Best day */}
            {d.bestDay && (
              <View style={[styles.bestDay, cardShadow]}>
                <Text style={styles.bestDayLabel}>Best day</Text>
                <Text style={styles.bestDayValue}>
                  {dayjs(d.bestDay.date).format('dddd, MMM D')}
                </Text>
                <Text style={styles.bestDaySub}>
                  {d.bestDay.kcal} kcal · {d.bestDay.protein}g protein
                  {d.bestDay.exercised ? ' · exercised 💪' : ''}
                </Text>
              </View>
            )}

            {/* Motivation */}
            <Text style={styles.motivation}>{motivation}</Text>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    maxHeight: '92%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingBottom: spacing.xl },

  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginTop: 2 },
  statSub: { fontSize: 10, color: colors.textMuted, marginTop: 1 },

  weightRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  weightLabel: { fontSize: 12, color: colors.textSecondary },
  weightValue: { fontSize: 22, fontWeight: '800' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  dayGrid: {
    flexDirection: 'row', gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dayCell: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm, alignItems: 'center', gap: 2,
  },
  dayCellActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dayLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  dayIcon: { fontSize: 11 },

  achRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  achItem: { flex: 1, alignItems: 'center' },
  achNum: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  achOf: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  achLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  achDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  bestDay: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  bestDayLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  bestDayValue: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  bestDaySub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

  motivation: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 20,
    marginBottom: spacing.lg, paddingHorizontal: spacing.md,
  },

  doneBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: spacing.lg, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

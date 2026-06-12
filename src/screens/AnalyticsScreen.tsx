import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS } from '../types';
import { useFitStore } from '../store/useFitStore';

type TabType = 'daily' | 'weekly' | 'streaks';

export default function AnalyticsScreen() {
  const [tab, setTab] = useState<TabType>('daily');
  const { logs, profile, weightHistory, mealPlan, ensureTodayLog, getStreak } =
    useFitStore();

  useFocusEffect(useCallback(() => { ensureTodayLog(); }, []));

  const streak = getStreak();

  // Yesterday's log
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdayLog = logs[yesterday];

  // Weekly data (last 7 days)
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD')
  );
  const weekLogs = weekDates.map((d) => logs[d]).filter(Boolean);

  const avgKcal =
    weekLogs.length > 0
      ? Math.round(
          weekLogs.reduce(
            (sum, l) =>
              sum +
              l.meals
                .filter((m) => m.logged)
                .reduce((s, m) => s + m.totalKcal, 0),
            0
          ) / weekLogs.length
        )
      : 0;

  const avgProtein =
    weekLogs.length > 0
      ? Math.round(
          weekLogs.reduce(
            (sum, l) =>
              sum +
              l.meals
                .filter((m) => m.logged)
                .reduce((s, m) => s + m.totalProtein, 0),
            0
          ) / weekLogs.length
        )
      : 0;

  const mealsHitDays = weekLogs.filter(
    (l) => l.meals.filter((m) => m.logged).length >= 3
  ).length;

  const exerciseDays = weekLogs.filter((l) => l.exercise.done).length;

  const weightChange =
    weightHistory.length >= 2
      ? (
          weightHistory[weightHistory.length - 1].weight -
          weightHistory[weightHistory.length - 2].weight
        ).toFixed(1)
      : null;

  // Calendar heatmap (last 28 days)
  const heatmapDates = Array.from({ length: 28 }, (_, i) =>
    dayjs().subtract(27 - i, 'day')
  );

  const getActivityScore = (date: string): number => {
    const l = logs[date];
    if (!l) return 0;
    const mealScore = l.meals.filter((m) => m.logged).length;
    const waterScore = l.water >= profile.waterGoal ? 1 : 0;
    const exScore = l.exercise.done ? 1 : 0;
    return mealScore + waterScore + exScore;
  };

  const maxScore = mealPlan.length + 2; // meals + water + exercise

  const scoreToColor = (score: number): string => {
    if (score === 0) return COLORS.border;
    const pct = score / maxScore;
    if (pct >= 0.8) return '#FF6B4A';
    if (pct >= 0.5) return '#FF9A7E';
    if (pct >= 0.2) return '#FFC5B3';
    return '#FFE8E0';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['daily', 'weekly', 'streaks'] as TabType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* DAILY TAB */}
        {tab === 'daily' && (
          <>
            <Text style={styles.sectionLabel}>Yesterday's Recap</Text>
            {yesterdayLog ? (
              <>
                <View style={styles.recapGrid}>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapValue, { color: COLORS.green }]}>
                      {yesterdayLog.meals
                        .filter((m) => m.logged)
                        .reduce((s, m) => s + m.totalKcal, 0)}
                    </Text>
                    <Text style={styles.recapLabel}>kcal eaten</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapValue, { color: COLORS.orange }]}>
                      {Math.round(
                        yesterdayLog.meals
                          .filter((m) => m.logged)
                          .reduce((s, m) => s + m.totalProtein, 0)
                      )}g
                    </Text>
                    <Text style={styles.recapLabel}>protein</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={styles.recapValue}>
                      {yesterdayLog.meals.filter((m) => m.logged).length}/
                      {mealPlan.length}
                    </Text>
                    <Text style={styles.recapLabel}>meals</Text>
                  </View>
                  <View style={styles.recapItem}>
                    <Text style={[styles.recapValue, { color: COLORS.blue }]}>
                      {yesterdayLog.water}
                    </Text>
                    <Text style={styles.recapLabel}>glasses</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <Ionicons
                      name={yesterdayLog.exercise.done ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={yesterdayLog.exercise.done ? COLORS.green : COLORS.red}
                    />
                    <Text style={styles.cardRowText}>
                      Exercise:{' '}
                      {yesterdayLog.exercise.done
                        ? `${yesterdayLog.exercise.activityName} — ${yesterdayLog.exercise.duration} min`
                        : yesterdayLog.exercise.skipped
                        ? 'Skipped'
                        : 'Not logged'}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Ionicons
                      name={yesterdayLog.weight ? 'scale' : 'scale-outline'}
                      size={18}
                      color={yesterdayLog.weight ? COLORS.green : COLORS.textSecondary}
                    />
                    <Text style={styles.cardRowText}>
                      Weight:{' '}
                      {yesterdayLog.weight
                        ? `${yesterdayLog.weight} kg`
                        : 'Not logged'}
                    </Text>
                  </View>
                  {yesterdayLog.wakeUpTime && (
                    <View style={styles.cardRow}>
                      <Ionicons name="sunny-outline" size={18} color={COLORS.yellow} />
                      <Text style={styles.cardRowText}>
                        Wake-up: {yesterdayLog.wakeUpTime}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No data for yesterday</Text>
              </View>
            )}
          </>
        )}

        {/* WEEKLY TAB */}
        {tab === 'weekly' && (
          <>
            <Text style={styles.sectionLabel}>Last 7 Days</Text>
            <View style={styles.recapGrid}>
              <View style={styles.recapItem}>
                <Text style={[styles.recapValue, { color: COLORS.green }]}>
                  {avgKcal}
                </Text>
                <Text style={styles.recapLabel}>avg kcal/day</Text>
              </View>
              <View style={styles.recapItem}>
                <Text style={[styles.recapValue, { color: COLORS.orange }]}>
                  {avgProtein}g
                </Text>
                <Text style={styles.recapLabel}>avg protein/day</Text>
              </View>
              <View style={styles.recapItem}>
                <Text style={styles.recapValue}>{mealsHitDays}/7</Text>
                <Text style={styles.recapLabel}>meal-on-plan days</Text>
              </View>
              <View style={styles.recapItem}>
                <Text style={[styles.recapValue, { color: COLORS.blue }]}>
                  {exerciseDays}/7
                </Text>
                <Text style={styles.recapLabel}>exercise days</Text>
              </View>
            </View>

            {weightChange !== null && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Weight Change</Text>
                <Text
                  style={[
                    styles.weightChangeText,
                    {
                      color:
                        parseFloat(weightChange) < 0
                          ? COLORS.green
                          : COLORS.red,
                    },
                  ]}
                >
                  {parseFloat(weightChange) < 0 ? '↓' : '↑'}{' '}
                  {Math.abs(parseFloat(weightChange))} kg this week
                </Text>
              </View>
            )}

            {/* Daily breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Breakdown</Text>
              {weekDates.map((date) => {
                const l = logs[date];
                const kcal = l
                  ? l.meals
                      .filter((m) => m.logged)
                      .reduce((s, m) => s + m.totalKcal, 0)
                  : 0;
                const pct = Math.min(kcal / profile.calorieGoal, 1);
                const isToday = date === dayjs().format('YYYY-MM-DD');
                return (
                  <View key={date} style={styles.weekBreakRow}>
                    <Text
                      style={[
                        styles.weekBreakDay,
                        isToday && { color: COLORS.green },
                      ]}
                    >
                      {dayjs(date).format('ddd')}
                    </Text>
                    <View style={styles.weekBreakBar}>
                      <View
                        style={[
                          styles.weekBreakFill,
                          {
                            width: `${pct * 100}%`,
                            backgroundColor: isToday
                              ? COLORS.green
                              : COLORS.greenDark,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.weekBreakKcal}>{kcal}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* STREAKS TAB */}
        {tab === 'streaks' && (
          <>
            <View style={styles.streakHero}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakDays}>
                day{streak !== 1 ? 's' : ''} streak
              </Text>
              <Text style={styles.streakSub}>
                {streak === 0
                  ? 'Start logging to build your streak!'
                  : streak < 7
                  ? `Keep going — ${7 - streak} days to a week!`
                  : streak < 30
                  ? 'Amazing consistency! Keep it up!'
                  : 'LEGENDARY! One month+ streak! 🏆'}
              </Text>
            </View>

            {/* Heatmap */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activity Heatmap (28 days)</Text>
              <View style={styles.heatmap}>
                {heatmapDates.map((d) => {
                  const dateStr = d.format('YYYY-MM-DD');
                  const score = getActivityScore(dateStr);
                  return (
                    <View
                      key={dateStr}
                      style={[
                        styles.heatCell,
                        { backgroundColor: scoreToColor(score) },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.heatLegend}>
                <Text style={styles.heatLegendText}>Less</Text>
                {['#FFE8E0', '#FFC5B3', '#FF9A7E', '#FF6B4A'].map(
                  (c) => (
                    <View
                      key={c}
                      style={[styles.heatLegendCell, { backgroundColor: c }]}
                    />
                  )
                )}
                <Text style={styles.heatLegendText}>More</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>All-time Stats</Text>
              <View style={styles.statsList}>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Total days logged</Text>
                  <Text style={styles.statsValue}>{Object.keys(logs).length}</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Weight entries</Text>
                  <Text style={styles.statsValue}>{weightHistory.length}</Text>
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Total weight lost</Text>
                  <Text style={[styles.statsValue, { color: COLORS.green }]}>
                    {(profile.startWeight - profile.currentWeight).toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: '#FFE8E0',
    borderColor: '#FF7A59',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F25C3F',
  },
  scroll: { paddingHorizontal: 16 },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  recapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  recapItem: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recapValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  recapLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardRowText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  weightChangeText: {
    fontSize: 24,
    fontWeight: '700',
  },
  weekBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  weekBreakDay: {
    color: COLORS.textSecondary,
    fontSize: 13,
    width: 32,
  },
  weekBreakBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  weekBreakFill: {
    height: '100%',
    borderRadius: 4,
  },
  weekBreakKcal: {
    color: COLORS.textSecondary,
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  streakHero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streakFire: { fontSize: 48, marginBottom: 4 },
  streakNum: {
    color: COLORS.yellow,
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  streakDays: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginBottom: 8,
  },
  streakSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  heatCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heatLegendText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  heatLegendCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  statsList: { gap: 2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statsValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

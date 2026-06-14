import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, ExercisePlan, WorkoutEntry } from '../types';
import { colors, radius, spacing, cardShadow } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { DAY_LABELS } from '../data/exercisePlan';
import { ACTIVITIES, calcKcal } from '../data/exerciseActivities';
import ConfettiBurst, { ConfettiBurstHandle } from '../components/anim/ConfettiBurst';
import { success } from '../utils/haptics';

const PLAN_ICONS: Record<string, string> = {
  'Walk': '🚶',
  'Stretching': '🧘',
  'Stair Climbing': '🏗️',
  'Stretching + Core': '💪',
  'Rest Day': '😴',
};

export default function ExerciseScreen() {
  const {
    exercisePlan, logExercise, skipExercise, ensureTodayLog,
    getTodayLog, addWorkout, removeWorkout, profile, logs,
  } = useFitStore();

  const [duration, setDuration] = useState('');
  const [addVisible, setAddVisible] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[0] | null>(null);
  const [customName, setCustomName] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('30');
  const [workoutKcal, setWorkoutKcal] = useState('');
  const [kcalEdited, setKcalEdited] = useState(false);
  const confetti = useRef<ConfettiBurstHandle>(null);

  useFocusEffect(useCallback(() => { ensureTodayLog(); }, []));

  const log = getTodayLog();
  const dayKey = dayjs().format('ddd').toLowerCase() as keyof ExercisePlan;
  const todayExercise = exercisePlan[dayKey];
  const isLogged = log.exercise.done;
  const isSkipped = log.exercise.skipped;
  const isPending = !isLogged && !isSkipped;
  const todayWorkouts = log.workouts ?? [];
  const bodyWeight = profile.currentWeight || 70;

  const weekStats = useMemo(() => {
    let totalMin = 0;
    let totalKcal = 0;
    let totalSessions = 0;
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const wks = logs[date]?.workouts ?? [];
      totalSessions += wks.length;
      totalMin += wks.reduce((s, w) => s + w.durationMin, 0);
      totalKcal += wks.reduce((s, w) => s + w.kcalBurned, 0);
    }
    return { totalMin, totalKcal, totalSessions };
  }, [logs]);

  const autoKcal = useMemo(() => {
    if (!selectedActivity) return 0;
    const dur = parseInt(workoutDuration, 10) || 0;
    return calcKcal(selectedActivity.met, bodyWeight, dur);
  }, [selectedActivity, workoutDuration, bodyWeight]);

  const handlePickActivity = (act: typeof ACTIVITIES[0]) => {
    setSelectedActivity(act);
    setKcalEdited(false);
    const dur = parseInt(workoutDuration, 10) || 30;
    setWorkoutKcal(String(calcKcal(act.met, bodyWeight, dur)));
  };

  const handleDurationChange = (val: string) => {
    setWorkoutDuration(val);
    if (!kcalEdited && selectedActivity) {
      const dur = parseInt(val, 10) || 0;
      setWorkoutKcal(String(calcKcal(selectedActivity.met, bodyWeight, dur)));
    }
  };

  const openAdd = () => {
    setEditingWorkoutId(null);
    setSelectedActivity(null);
    setCustomName('');
    setWorkoutDuration('30');
    setWorkoutKcal('');
    setKcalEdited(false);
    setAddVisible(true);
  };

  const openEdit = (w: WorkoutEntry) => {
    setEditingWorkoutId(w.id);
    const act = ACTIVITIES.find((a) => a.name === w.activity) ?? ACTIVITIES.find((a) => a.name === 'Other')!;
    setSelectedActivity(act);
    setCustomName(act.name === 'Other' ? w.activity : '');
    setWorkoutDuration(String(w.durationMin));
    setWorkoutKcal(String(w.kcalBurned));
    setKcalEdited(true);
    setAddVisible(true);
  };

  const canLog =
    !!selectedActivity &&
    (selectedActivity.name !== 'Other' || customName.trim().length > 0) &&
    parseInt(workoutDuration, 10) > 0;

  const handleLogWorkout = () => {
    if (!selectedActivity) return;
    const dur = parseInt(workoutDuration, 10);
    if (!dur || dur <= 0) return;
    const name =
      selectedActivity.name === 'Other'
        ? customName.trim() || 'Other'
        : selectedActivity.name;
    const kcal = parseInt(workoutKcal, 10) || 0;
    if (editingWorkoutId) {
      removeWorkout(editingWorkoutId);
    }
    addWorkout({ activity: name, emoji: selectedActivity.emoji, durationMin: dur, kcalBurned: kcal });
    setEditingWorkoutId(null);
    setAddVisible(false);
    success();
    confetti.current?.burst();
  };

  const handleDone = () => {
    const d = parseInt(duration, 10) || todayExercise.duration;
    logExercise(d);
    success();
    confetti.current?.burst();
  };

  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const todayIndex = weekDays.indexOf(dayKey);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Exercise</Text>
          <Text style={styles.subtitle}>{dayjs().format('dddd, MMMM D')}</Text>
        </View>

        {/* Week stats bar */}
        {weekStats.totalSessions > 0 && (
          <View style={[styles.weekStatsRow, cardShadow]}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{weekStats.totalSessions}</Text>
              <Text style={styles.weekStatLabel}>workouts</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{weekStats.totalMin}</Text>
              <Text style={styles.weekStatLabel}>min this week</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{weekStats.totalKcal}</Text>
              <Text style={styles.weekStatLabel}>kcal burned</Text>
            </View>
          </View>
        )}

        {/* Today's plan */}
        <View style={[
          styles.todayCard,
          todayExercise.isRest && styles.restCard,
          isLogged && styles.loggedCard,
          isSkipped && styles.skippedCard,
        ]}>
          <Text style={styles.exerciseEmoji}>{PLAN_ICONS[todayExercise.activity] ?? '🏃'}</Text>
          <Text style={styles.exerciseName}>{todayExercise.activity}</Text>
          {!todayExercise.isRest && (
            <Text style={styles.exerciseDuration}>Target: {todayExercise.duration} min</Text>
          )}
          {isLogged && (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
              <Text style={styles.doneText}>Done! {log.exercise.duration} min</Text>
            </View>
          )}
          {isSkipped && (
            <View style={styles.doneRow}>
              <Ionicons name="close-circle" size={20} color={COLORS.red} />
              <Text style={[styles.doneText, { color: COLORS.red }]}>Skipped</Text>
            </View>
          )}
        </View>

        {isPending && !todayExercise.isRest && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log Today's Plan</Text>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={duration}
                onChangeText={setDuration}
                placeholder={String(todayExercise.duration)}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.minLabel}>min</Text>
            </View>
            <TouchableOpacity style={styles.btnDone} onPress={handleDone}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.btnDoneText}>
                Mark as done ({duration || todayExercise.duration} min)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSkip} onPress={skipExercise}>
              <Text style={styles.btnSkipText}>Skip today</Text>
            </TouchableOpacity>
          </View>
        )}

        {todayExercise.isRest && isPending && (
          <View style={styles.restMessage}>
            <Text style={styles.restMessageText}>Today is your rest day. Take it easy! 💤</Text>
            <TouchableOpacity style={styles.btnDone} onPress={() => logExercise(0)}>
              <Text style={styles.btnDoneText}>Mark rest day done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Workouts logged today */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>Today's workouts</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.7}>
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {todayWorkouts.length === 0 ? (
            <TouchableOpacity style={styles.emptyWorkout} onPress={openAdd} activeOpacity={0.7}>
              <Ionicons name="fitness-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No workouts logged yet</Text>
              <Text style={styles.emptySub}>Running, gym, yoga — log anything here</Text>
            </TouchableOpacity>
          ) : (
            todayWorkouts.map((w) => (
              <View key={w.id} style={styles.workoutRow}>
                <Text style={styles.workoutEmoji}>{w.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName}>{w.activity}</Text>
                  <Text style={styles.workoutMeta}>
                    {w.durationMin} min · {w.kcalBurned} kcal · {w.addedAt}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openEdit(w)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginRight: 8 }}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeWorkout(w.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* 7-day burn history */}
        {weekStats.totalSessions > 0 && (() => {
          const histDays = Array.from({ length: 7 }, (_, i) => {
            const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
            const wks = logs[date]?.workouts ?? [];
            const burned = wks.reduce((s, w) => s + w.kcalBurned, 0);
            return { date, burned, label: dayjs(date).format('dd') };
          });
          const maxBurned = Math.max(...histDays.map((d) => d.burned), 1);
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>7-Day Burn History</Text>
              <View style={styles.histChart}>
                {histDays.map((d) => {
                  const pct = d.burned / maxBurned;
                  const isToday = d.date === dayjs().format('YYYY-MM-DD');
                  return (
                    <View key={d.date} style={styles.histBar}>
                      {d.burned > 0 && (
                        <Text style={styles.histKcal}>
                          {d.burned >= 1000 ? `${(d.burned / 1000).toFixed(1)}k` : d.burned}
                        </Text>
                      )}
                      <View style={styles.histBarTrack}>
                        <View
                          style={[
                            styles.histBarFill,
                            {
                              height: `${Math.max(pct * 100, d.burned > 0 ? 4 : 0)}%`,
                              backgroundColor: isToday ? colors.primary : colors.primarySoft,
                              borderColor: isToday ? colors.primaryDark : colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.histLabel, isToday && { color: colors.primary, fontWeight: '700' }]}>
                        {d.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Weekly rotation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Rotation</Text>
          {weekDays.map((day, i) => {
            const ex = exercisePlan[day];
            const isToday = i === todayIndex;
            return (
              <View key={day} style={[styles.weekRow, isToday && styles.weekRowToday]}>
                <View style={styles.weekLeft}>
                  <Text style={[styles.weekDay, isToday && { color: COLORS.green }]}>
                    {DAY_LABELS[day].slice(0, 3)}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </View>
                <Text style={styles.weekEmoji}>{PLAN_ICONS[ex.activity] ?? '🏃'}</Text>
                <View style={styles.weekRight}>
                  <Text style={[styles.weekActivity, isToday && { color: COLORS.textPrimary }]}>
                    {ex.activity}
                  </Text>
                  {!ex.isRest && <Text style={styles.weekDuration}>{ex.duration} min</Text>}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <ConfettiBurst ref={confetti} />

      {/* Add Workout Modal */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAddVisible(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingWorkoutId ? 'Edit Workout' : 'Log a Workout'}</Text>

            <Text style={styles.fieldLabel}>Activity</Text>
            <View style={styles.activityGrid}>
              {ACTIVITIES.map((act) => {
                const active = selectedActivity?.name === act.name;
                return (
                  <TouchableOpacity
                    key={act.name}
                    style={[styles.activityChip, active && styles.activityChipActive]}
                    onPress={() => handlePickActivity(act)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activityEmoji}>{act.emoji}</Text>
                    <Text style={[styles.activityLabel, active && styles.activityLabelActive]}>
                      {act.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedActivity?.name === 'Other' && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Activity name</Text>
                <TextInput
                  style={styles.textInput}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. Rock climbing"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </>
            )}

            <View style={styles.macroRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Duration (min)</Text>
                <TextInput
                  style={styles.textInput}
                  value={workoutDuration}
                  onChangeText={handleDurationChange}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </View>
              <View style={{ width: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Kcal burned</Text>
                <TextInput
                  style={[styles.textInput, !kcalEdited && selectedActivity && styles.textInputAuto]}
                  value={workoutKcal}
                  onChangeText={(v) => { setWorkoutKcal(v); setKcalEdited(true); }}
                  keyboardType="numeric"
                  selectTextOnFocus
                  placeholder={selectedActivity ? String(autoKcal) : '—'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {selectedActivity && !kcalEdited && (
              <Text style={styles.kcalHint}>Auto-estimated from MET × weight. Tap to override.</Text>
            )}

            <TouchableOpacity
              style={[styles.logBtn, !canLog && styles.logBtnDisabled]}
              onPress={handleLogWorkout}
              disabled={!canLog}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.logBtnText}>Log workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 56 },

  header: { marginBottom: 16 },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },

  weekStatsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: 12,
  },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatVal: { fontSize: 20, fontWeight: '800', color: colors.primary },
  weekStatLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  weekStatDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  todayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restCard: { backgroundColor: colors.skySoft, borderColor: colors.sky },
  loggedCard: { borderColor: colors.mint, backgroundColor: colors.mintSoft },
  skippedCard: { borderColor: colors.border, opacity: 0.7 },
  exerciseEmoji: { fontSize: 48, marginBottom: 10 },
  exerciseName: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  exerciseDuration: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 12 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  doneText: { color: COLORS.green, fontSize: 15, fontWeight: '600' },

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
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  durationInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  minLabel: { color: COLORS.textSecondary, fontSize: 16 },
  btnDone: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  btnDoneText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSkip: { padding: 12, alignItems: 'center' },
  btnSkipText: { color: COLORS.red, fontSize: 14 },
  restMessage: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restMessageText: { color: COLORS.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 16 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyWorkout: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  workoutEmoji: { fontSize: 24 },
  workoutName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  workoutMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  weekRowToday: {
    backgroundColor: COLORS.greenBg,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  weekLeft: { width: 40, alignItems: 'flex-start', position: 'relative' },
  weekDay: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  todayDot: {
    position: 'absolute',
    top: -2,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  weekEmoji: { fontSize: 20 },
  weekRight: { flex: 1 },
  weekActivity: { color: COLORS.textSecondary, fontSize: 14 },
  weekDuration: { color: COLORS.textSecondary, fontSize: 12, marginTop: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityChip: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  activityChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  activityEmoji: { fontSize: 22 },
  activityLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  activityLabelActive: { color: colors.primaryDark },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textInputAuto: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
  },
  macroRow: { flexDirection: 'row' },
  kcalHint: { fontSize: 11, color: colors.textMuted, marginTop: 6, marginBottom: 4 },
  logBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  logBtnDisabled: { opacity: 0.4 },
  logBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  histChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
  },
  histBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  histKcal: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  histBarTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  histBarFill: {
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
  },
  histLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

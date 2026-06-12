import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, ExercisePlan } from '../types';
import { colors } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { DAY_LABELS } from '../data/exercisePlan';
import ConfettiBurst, { ConfettiBurstHandle } from '../components/anim/ConfettiBurst';
import { success } from '../utils/haptics';
import { useRef } from 'react';

const EXERCISE_ICONS: Record<string, string> = {
  'Walk': '🚶',
  'Stretching': '🧘',
  'Stair Climbing': '🏗️',
  'Stretching + Core': '💪',
  'Rest Day': '😴',
};

export default function ExerciseScreen() {
  const { exercisePlan, logExercise, skipExercise, ensureTodayLog, getTodayLog } =
    useFitStore();
  const [duration, setDuration] = useState('');
  const confetti = useRef<ConfettiBurstHandle>(null);

  useFocusEffect(useCallback(() => { ensureTodayLog(); }, []));

  const log = getTodayLog();
  const dayKey = dayjs().format('ddd').toLowerCase() as keyof ExercisePlan;
  const todayExercise = exercisePlan[dayKey];

  const isLogged = log.exercise.done;
  const isSkipped = log.exercise.skipped;
  const isPending = !isLogged && !isSkipped;

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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Exercise</Text>
          <Text style={styles.subtitle}>{dayjs().format('dddd, MMMM D')}</Text>
        </View>

        {/* Today's exercise */}
        <View
          style={[
            styles.todayCard,
            todayExercise.isRest && styles.restCard,
            isLogged && styles.loggedCard,
            isSkipped && styles.skippedCard,
          ]}
        >
          <Text style={styles.exerciseEmoji}>
            {EXERCISE_ICONS[todayExercise.activity] ?? '🏃'}
          </Text>
          <Text style={styles.exerciseName}>{todayExercise.activity}</Text>
          {!todayExercise.isRest && (
            <Text style={styles.exerciseDuration}>
              Target: {todayExercise.duration} min
            </Text>
          )}

          {isLogged && (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
              <Text style={styles.doneText}>
                Done! {log.exercise.duration} min
              </Text>
            </View>
          )}
          {isSkipped && (
            <View style={styles.doneRow}>
              <Ionicons name="close-circle" size={20} color={COLORS.red} />
              <Text style={[styles.doneText, { color: COLORS.red }]}>Skipped</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {isPending && !todayExercise.isRest && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log Today's Exercise</Text>
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
            <Text style={styles.restMessageText}>
              Today is your rest day. Take it easy! 💤
            </Text>
            <TouchableOpacity
              style={styles.btnDone}
              onPress={() => logExercise(0)}
            >
              <Text style={styles.btnDoneText}>Mark rest day done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly plan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Rotation</Text>
          {weekDays.map((day, i) => {
            const ex = exercisePlan[day];
            const isToday = i === todayIndex;
            return (
              <View
                key={day}
                style={[styles.weekRow, isToday && styles.weekRowToday]}
              >
                <View style={styles.weekLeft}>
                  <Text style={[styles.weekDay, isToday && { color: COLORS.green }]}>
                    {DAY_LABELS[day].slice(0, 3)}
                  </Text>
                  {isToday && (
                    <View style={styles.todayDot} />
                  )}
                </View>
                <Text style={styles.weekEmoji}>
                  {EXERCISE_ICONS[ex.activity] ?? '🏃'}
                </Text>
                <View style={styles.weekRight}>
                  <Text style={[styles.weekActivity, isToday && { color: COLORS.textPrimary }]}>
                    {ex.activity}
                  </Text>
                  {!ex.isRest && (
                    <Text style={styles.weekDuration}>{ex.duration} min</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
      <ConfettiBurst ref={confetti} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 56 },
  header: { marginBottom: 20 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  todayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restCard: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  loggedCard: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
  },
  skippedCard: {
    borderColor: colors.border,
    opacity: 0.7,
  },
  exerciseEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  exerciseName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  exerciseDuration: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  doneText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
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
  minLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
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
  btnDoneText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSkip: {
    padding: 12,
    alignItems: 'center',
  },
  btnSkipText: {
    color: COLORS.red,
    fontSize: 14,
  },
  restMessage: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restMessageText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
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
  weekLeft: {
    width: 40,
    alignItems: 'flex-start',
    position: 'relative',
  },
  weekDay: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
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
  weekActivity: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  weekDuration: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
});

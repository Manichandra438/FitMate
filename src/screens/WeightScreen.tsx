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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS } from '../types';
import { useFitStore } from '../store/useFitStore';
import WeightChart from '../components/WeightChart';

function projectGoalDate(history: { date: string; weight: number }[], goal: number) {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  const days = dayjs(last.date).diff(dayjs(first.date), 'day') || 1;
  const dailyLoss = (first.weight - last.weight) / days;
  if (dailyLoss <= 0) return null;
  const daysLeft = (last.weight - goal) / dailyLoss;
  return dayjs(last.date).add(Math.round(daysLeft), 'day').format('MMM D, YYYY');
}

export default function WeightScreen() {
  const { profile, weightHistory, logWeight, getTodayLog, ensureTodayLog } =
    useFitStore();
  const [inputWeight, setInputWeight] = useState('');

  useFocusEffect(
    useCallback(() => {
      ensureTodayLog();
    }, [])
  );

  const todayLog = getTodayLog();
  const todayWeight = todayLog.weight;
  const projection = projectGoalDate(weightHistory, profile.goalWeight);

  const totalLost =
    weightHistory.length > 0
      ? (profile.startWeight - profile.currentWeight).toFixed(1)
      : '0';

  const toGoal = (profile.currentWeight - profile.goalWeight).toFixed(1);

  const handleLog = () => {
    const w = parseFloat(inputWeight);
    if (isNaN(w) || w < 30 || w > 300) {
      Alert.alert('Invalid weight', 'Enter a weight between 30 and 300 kg.');
      return;
    }
    logWeight(w);
    setInputWeight('');
  };

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
          <Text style={styles.title}>Weight Tracker</Text>
          <Text style={styles.subtitle}>
            Goal: {profile.goalWeight} kg
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.blue }]}>
              {profile.currentWeight}
            </Text>
            <Text style={styles.statLabel}>Current (kg)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>
              {totalLost}
            </Text>
            <Text style={styles.statLabel}>Lost (kg)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.orange }]}>
              {toGoal}
            </Text>
            <Text style={styles.statLabel}>To go (kg)</Text>
          </View>
        </View>

        {/* Projection */}
        {projection && (
          <View style={styles.projectionCard}>
            <Ionicons name="flag" size={18} color={COLORS.green} />
            <Text style={styles.projectionText}>
              At this pace, you hit{' '}
              <Text style={{ color: COLORS.green }}>{profile.goalWeight} kg</Text>{' '}
              by{' '}
              <Text style={{ color: COLORS.green, fontWeight: '700' }}>
                {projection}
              </Text>
              !
            </Text>
          </View>
        )}

        {/* Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress Chart</Text>
          <WeightChart
            data={weightHistory}
            goalWeight={profile.goalWeight}
            height={200}
          />
        </View>

        {/* Log today's weight */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {todayWeight ? 'Update Today' : "Today's Weigh-In"}
          </Text>
          {todayWeight && (
            <Text style={styles.todayWeight}>
              Logged: <Text style={{ color: COLORS.blue }}>{todayWeight} kg</Text>
            </Text>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={inputWeight}
              onChangeText={setInputWeight}
              placeholder={
                todayWeight
                  ? `${todayWeight}`
                  : `${profile.currentWeight}`
              }
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleLog}
            />
            <Text style={styles.kgLabel}>kg</Text>
            <TouchableOpacity
              style={[
                styles.logBtn,
                !inputWeight && styles.logBtnDisabled,
              ]}
              onPress={handleLog}
              disabled={!inputWeight}
            >
              <Text style={styles.logBtnText}>
                {todayWeight ? 'Update' : 'Log'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History */}
        {weightHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Entries</Text>
            {[...weightHistory]
              .reverse()
              .slice(0, 10)
              .map((entry) => (
                <View key={entry.date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {dayjs(entry.date).format('ddd, MMM D')}
                  </Text>
                  <Text style={styles.historyWeight}>
                    {entry.weight} kg
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 56 },
  header: { marginBottom: 16 },
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  projectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.greenBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.greenDark,
  },
  projectionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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
  todayWeight: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightInput: {
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
  kgLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  logBtn: {
    backgroundColor: '#FF7A59',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  logBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  historyWeight: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

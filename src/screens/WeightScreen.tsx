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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS } from '../types';
import { useFitStore } from '../store/useFitStore';
import WeightChart from '../components/WeightChart';

function projectGoalDate(
  history: { date: string; weight: number }[],
  goal: number,
  currentWeight: number,
): { date: string | null; weeklyRate: number } {
  const cutoff = dayjs().subtract(21, 'day').format('YYYY-MM-DD');
  let recent = [...history]
    .filter((w) => w.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (recent.length < 2) {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) return { date: null, weeklyRate: 0 };
    recent = sorted.slice(-5);
  }
  const first = recent[0];
  const last = recent[recent.length - 1];
  const days = dayjs(last.date).diff(dayjs(first.date), 'day') || 1;
  const weeklyRate = Math.round(((last.weight - first.weight) / days) * 7 * 10) / 10;
  const losingGoal = goal < currentWeight;
  const gainingGoal = goal > currentWeight;
  if (losingGoal && weeklyRate >= -0.05) return { date: null, weeklyRate };
  if (gainingGoal && weeklyRate <= 0.05) return { date: null, weeklyRate };
  if (Math.abs(currentWeight - goal) < 0.3) return { date: null, weeklyRate };
  const kgToGo = goal - currentWeight;
  const daysLeft = Math.round((kgToGo / weeklyRate) * 7);
  if (daysLeft <= 0 || daysLeft > 730) return { date: null, weeklyRate };
  return { date: dayjs().add(daysLeft, 'day').format('MMM D, YYYY'), weeklyRate };
}

function computeBMI(weightKg: number, heightCm: number): number {
  if (!heightCm) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#58B9F4' };
  if (bmi < 25) return { label: 'Normal weight', color: '#34C79A' };
  if (bmi < 30) return { label: 'Overweight', color: '#FFC145' };
  return { label: 'Obese', color: '#F4604F' };
}

export default function WeightScreen() {
  const navigation = useNavigation<any>();
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
  const { date: projDate, weeklyRate } = projectGoalDate(weightHistory, profile.goalWeight, profile.currentWeight);
  const bmi = computeBMI(profile.currentWeight, profile.heightCm);
  const bmiInfo = bmiCategory(bmi);

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

        {/* BMI Card */}
        {bmi > 0 && (
          <View style={styles.bmiCard}>
            <View style={styles.bmiLeft}>
              <Text style={styles.bmiTitle}>BMI</Text>
              <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi}</Text>
              <Text style={[styles.bmiLabel, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
            </View>
            <View style={styles.bmiPills}>
              {[
                { label: 'Under', range: '<18.5', color: '#58B9F4', active: bmi < 18.5 },
                { label: 'Normal', range: '18.5–25', color: '#34C79A', active: bmi >= 18.5 && bmi < 25 },
                { label: 'Over', range: '25–30', color: '#FFC145', active: bmi >= 25 && bmi < 30 },
                { label: 'Obese', range: '>30', color: '#F4604F', active: bmi >= 30 },
              ].map((cat) => (
                <View
                  key={cat.label}
                  style={[
                    styles.bmiPill,
                    cat.active && { backgroundColor: cat.color + '25', borderColor: cat.color },
                  ]}
                >
                  <Text style={[styles.bmiPillLabel, cat.active && { color: cat.color, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.bmiPillRange, cat.active && { color: cat.color }]}>{cat.range}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Projection */}
        {projDate && (
          <View style={styles.projectionCard}>
            <Ionicons name="flag" size={18} color={COLORS.green} />
            <Text style={styles.projectionText}>
              At <Text style={{ color: COLORS.green, fontWeight: '700' }}>
                {weeklyRate > 0 ? '+' : ''}{weeklyRate} kg/week
              </Text>
              , hit <Text style={{ color: COLORS.green }}>{profile.goalWeight} kg</Text>{' '}
              by <Text style={{ color: COLORS.green, fontWeight: '700' }}>{projDate}</Text>
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

        {/* Body measurements link */}
        <TouchableOpacity
          style={styles.measureCard}
          onPress={() => navigation.navigate('Measurements')}
          activeOpacity={0.7}
        >
          <View style={styles.measureIcon}>
            <Ionicons name="body" size={20} color={COLORS.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.measureTitle}>Body Measurements</Text>
            <Text style={styles.measureSub}>Track waist, chest, hips and more</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

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
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bmiLeft: { alignItems: 'center', minWidth: 60 },
  bmiTitle: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  bmiValue: { fontSize: 28, fontWeight: '800' },
  bmiLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  bmiPills: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bmiPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  bmiPillLabel: { fontSize: 11, color: COLORS.textSecondary },
  bmiPillRange: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },

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
  measureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  measureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E3F3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  measureSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});

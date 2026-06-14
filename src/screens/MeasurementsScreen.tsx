import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, radius, spacing, cardShadow } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { BodyMeasurement } from '../types';

const METRICS: { key: keyof BodyMeasurement; label: string; icon: string; unit: string }[] = [
  { key: 'waist', label: 'Waist', icon: '📏', unit: 'cm' },
  { key: 'chest', label: 'Chest', icon: '💪', unit: 'cm' },
  { key: 'hips', label: 'Hips', icon: '📐', unit: 'cm' },
  { key: 'arms', label: 'Arms', icon: '🦾', unit: 'cm' },
  { key: 'thighs', label: 'Thighs', icon: '🦵', unit: 'cm' },
  { key: 'bodyFat', label: 'Body Fat', icon: '📊', unit: '%' },
];

export default function MeasurementsScreen() {
  const navigation = useNavigation();
  const { bodyMeasurements, addBodyMeasurement } = useFitStore();
  const [values, setValues] = useState<Partial<Record<keyof BodyMeasurement, string>>>({});

  const today = dayjs().format('YYYY-MM-DD');
  const todayEntry = bodyMeasurements.find((m) => m.date === today);
  const lastEntry = bodyMeasurements.length > 0 ? bodyMeasurements[bodyMeasurements.length - 1] : null;

  const handleSave = () => {
    const m: BodyMeasurement = { date: today };
    let hasAny = false;
    for (const { key } of METRICS) {
      if (key === 'date') continue;
      const v = parseFloat(values[key] ?? '');
      if (!isNaN(v) && v > 0) {
        (m as any)[key] = v;
        hasAny = true;
      }
    }
    if (!hasAny) { Alert.alert('Enter at least one measurement.'); return; }
    addBodyMeasurement(m);
    setValues({});
    Alert.alert('Saved!', 'Measurements recorded.');
  };

  const delta = (key: keyof BodyMeasurement) => {
    if (!lastEntry || !lastEntry[key] || !todayEntry?.[key]) return null;
    const d = ((todayEntry[key] as number) - (lastEntry[key] as number)).toFixed(1);
    return d;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Body Measurements</Text>
        <Text style={styles.subtitle}>{dayjs().format('MMMM D, YYYY')}</Text>

        {/* Latest snapshot */}
        {lastEntry && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last recorded — {dayjs(lastEntry.date).format('MMM D')}</Text>
            <View style={styles.grid}>
              {METRICS.map(({ key, label, icon, unit }) =>
                lastEntry[key] ? (
                  <View key={key} style={styles.gridItem}>
                    <Text style={styles.gridEmoji}>{icon}</Text>
                    <Text style={styles.gridVal}>{lastEntry[key]}{unit}</Text>
                    <Text style={styles.gridLabel}>{label}</Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        )}

        {/* Input today */}
        <Text style={styles.sectionTitle}>Log today</Text>
        {METRICS.map(({ key, label, icon, unit }) => (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputEmoji}>{icon}</Text>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputRight}>
              <TextInput
                style={styles.input}
                value={values[key] ?? ''}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                keyboardType="numeric"
                placeholder={todayEntry?.[key] ? String(todayEntry[key]) : '—'}
                placeholderTextColor={colors.textMuted}
                selectTextOnFocus
              />
              <Text style={styles.inputUnit}>{unit}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>Save measurements</Text>
        </TouchableOpacity>

        {/* History */}
        {bodyMeasurements.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            {[...bodyMeasurements].reverse().slice(0, 10).map((entry) => (
              <View key={entry.date} style={styles.historyRow}>
                <Text style={styles.historyDate}>{dayjs(entry.date).format('MMM D, YYYY')}</Text>
                <Text style={styles.historyVals}>
                  {METRICS.filter((m) => entry[m.key]).map((m) => `${m.label}: ${entry[m.key]}${m.unit}`).join(' · ')}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 20, ...cardShadow },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { alignItems: 'center', width: '28%' },
  gridEmoji: { fontSize: 20, marginBottom: 2 },
  gridVal: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  gridLabel: { fontSize: 11, color: colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8, gap: 10 },
  inputEmoji: { fontSize: 18, width: 24 },
  inputLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  inputRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { backgroundColor: colors.surfaceHigh, borderRadius: 8, padding: 8, color: colors.textPrimary, fontSize: 15, fontWeight: '700', width: 72, textAlign: 'center', borderWidth: 1, borderColor: colors.border },
  inputUnit: { fontSize: 12, color: colors.textSecondary, width: 20 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyRow: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  historyDate: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  historyVals: { fontSize: 12, color: colors.textSecondary },
});

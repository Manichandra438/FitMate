import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, colors, radius, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { computeTargets, generatePlan } from '../services/planGenerator';
import { flush } from '../services/sync';
import { OptionCard, Segment } from './onboarding/inputs';
import SectionHeader from '../components/ui/SectionHeader';
import IFInfoModal from '../components/IFInfoModal';
import type { ActivityLevel, DietPref, FastingProtocol, Gender, GoalPace, MealsPerDay } from '../types';

// ─── Time constants ──────────────────────────────────────────────────────────

const WAKE_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let min = 4 * 60; min <= 11 * 60; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return out;
})();

const SLEEP_TIMES = [
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  '23:00', '23:30', '00:00', '00:30', '01:00', '01:30', '02:00',
];

function fmt12(t: string) {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Height helpers ───────────────────────────────────────────────────────────

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), inch: Math.round(totalIn % 12) };
}

function ftInToCm(ft: number, inch: number) {
  return Math.round(ft * 30.48 + inch * 2.54);
}

// ─── Option data ──────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; subtitle: string; emoji: string }[] = [
  { value: 'sedentary',  title: 'Sedentary',     subtitle: 'Desk job, little movement',     emoji: '🪑' },
  { value: 'light',      title: 'Lightly active', subtitle: '1–3 workouts per week',         emoji: '🚶' },
  { value: 'moderate',   title: 'Moderate',        subtitle: '3–5 workouts per week',         emoji: '🏃' },
  { value: 'active',     title: 'Very active',     subtitle: 'Hard training 6–7 days/week',  emoji: '💪' },
  { value: 'veryActive', title: 'Athlete',          subtitle: 'Twice daily or physical job',  emoji: '🏋️' },
];

const PACE_OPTIONS: { value: GoalPace; title: string; subtitle: string; emoji: string }[] = [
  { value: 'gentle',     title: 'Gentle',     subtitle: '~0.25 kg/week · easy, sustainable', emoji: '🌱' },
  { value: 'steady',     title: 'Steady',     subtitle: '~0.5 kg/week · balanced approach',  emoji: '⚖️' },
  { value: 'aggressive', title: 'Aggressive', subtitle: '~0.75 kg/week · intense deficit',   emoji: '🔥' },
];

const DIET_OPTIONS: { value: DietPref; title: string; subtitle: string; emoji: string }[] = [
  { value: 'veg',         title: 'Vegetarian',    subtitle: 'No meat or fish',      emoji: '🥦' },
  { value: 'eggetarian',  title: 'Eggetarian',    subtitle: 'Veg + eggs',           emoji: '🥚' },
  { value: 'nonveg',      title: 'Non-vegetarian', subtitle: 'All foods included',  emoji: '🍗' },
];

const IF_OPTIONS: { value: FastingProtocol; label: string; window: string; desc: string }[] = [
  { value: 'none', label: 'No fasting', window: 'All day', desc: 'Meals spread across your wake hours' },
  { value: '16:8', label: '16:8', window: '12 pm – 8 pm', desc: 'Fast 16h, eat within an 8-hour window' },
  { value: '18:6', label: '18:6', window: '1 pm – 7 pm', desc: 'Fast 18h, eat within a 6-hour window' },
  { value: '20:4', label: '20:4', window: '2 pm – 6 pm', desc: 'Fast 20h, eat within a 4-hour window' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, setProfile, updateMealPlan } = useFitStore();

  const initFtIn = cmToFtIn(profile.heightCm);

  const [name, setName]               = useState(profile.name);
  const [age, setAge]                 = useState(profile.age);
  const [gender, setGender]           = useState<Gender>(profile.gender);
  const [heightUnit, setHeightUnit]   = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm]       = useState(String(profile.heightCm));
  const [heightFt, setHeightFt]       = useState(String(initFtIn.ft));
  const [heightIn, setHeightIn]       = useState(String(initFtIn.inch));
  const [currentWeight, setCurrentWeight] = useState(String(profile.currentWeight));
  const [goalWeight, setGoalWeight]   = useState(String(profile.goalWeight));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goalPace, setGoalPace]       = useState<GoalPace>(profile.goalPace);
  const [dietPref, setDietPref]       = useState<DietPref>(profile.dietPref);
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(profile.mealsPerDay);
  const [wakeTime, setWakeTime]       = useState(profile.wakeTime);
  const [sleepTime, setSleepTime]     = useState(profile.sleepTime);
  const [waterGoal, setWaterGoal]     = useState(profile.waterGoal);
  const [fastingProtocol, setFastingProtocol] = useState<FastingProtocol>(profile.fastingProtocol ?? 'none');
  const [ifInfoVisible, setIfInfoVisible] = useState(false);
  const [saving, setSaving]           = useState(false);

  const resolvedCm = useMemo(() => {
    if (heightUnit === 'cm') return parseInt(heightCm, 10) || profile.heightCm;
    return ftInToCm(parseInt(heightFt, 10) || 0, parseInt(heightIn, 10) || 0);
  }, [heightUnit, heightCm, heightFt, heightIn, profile.heightCm]);

  const previewTargets = useMemo(() => {
    const w = parseFloat(currentWeight);
    const g = parseFloat(goalWeight);
    if (!w || !g || resolvedCm < 100) return null;
    try {
      return computeTargets({
        name, age, gender, heightCm: resolvedCm,
        currentWeight: w, goalWeight: g,
        activityLevel, dietPref, mealsPerDay,
        goalPace, wakeTime, sleepTime, waterGoal,
        goalDate: profile.goalDate,
      });
    } catch {
      return null;
    }
  }, [name, age, gender, resolvedCm, currentWeight, goalWeight,
      activityLevel, dietPref, mealsPerDay, goalPace, wakeTime,
      sleepTime, waterGoal, profile.goalDate]);

  const handleSave = async () => {
    const parsedWeight = parseFloat(currentWeight);
    const parsedGoal   = parseFloat(goalWeight);
    const cm           = resolvedCm;

    if (!name.trim())                              { Alert.alert('Enter your name');                   return; }
    if (age < 10 || age > 100)                     { Alert.alert('Enter a valid age (10–100)');        return; }
    if (isNaN(parsedWeight) || parsedWeight < 20)  { Alert.alert('Enter a valid current weight');      return; }
    if (isNaN(parsedGoal)   || parsedGoal   < 20)  { Alert.alert('Enter a valid goal weight');         return; }
    if (cm < 100 || cm > 250)                      { Alert.alert('Enter a valid height');              return; }

    setSaving(true);
    try {
      const answers = {
        name: name.trim(), age, gender, heightCm: cm,
        currentWeight: parsedWeight, goalWeight: parsedGoal,
        activityLevel, dietPref, mealsPerDay, goalPace,
        wakeTime, sleepTime, waterGoal, fastingProtocol,
        goalDate: profile.goalDate,
      };
      const { targets, mealPlan } = generatePlan(answers);
      setProfile({
        name: answers.name, age, gender, heightCm: cm,
        currentWeight: parsedWeight, goalWeight: parsedGoal,
        activityLevel, dietPref, mealsPerDay, goalPace,
        wakeTime, sleepTime, waterGoal, fastingProtocol,
        calorieGoal: targets.calorieGoal,
        proteinGoal: targets.proteinGoal,
        goalDate: profile.goalDate ?? targets.goalDate ?? undefined,
      });
      updateMealPlan(mealPlan);
      await flush().catch(() => {});
      Alert.alert(
        'Profile updated',
        `Calorie goal: ${targets.calorieGoal} kcal · Protein: ${targets.proteinGoal} g · Meal plan regenerated.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PERSONAL ─────────────────────────────── */}
        <SectionHeader title="Personal info" />

        <Label>Name</Label>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
        />

        <Label>Age</Label>
        <Stepper value={age} min={10} max={100} onChange={setAge} unit="yrs" />

        <Label>Gender</Label>
        <Segment<Gender>
          options={[
            { value: 'male',   label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other',  label: 'Other' },
          ]}
          value={gender}
          onChange={setGender}
        />

        <Label>Height</Label>
        <View style={{ marginBottom: spacing.sm }}>
          <Segment<'cm' | 'ft'>
            options={[{ value: 'cm', label: 'cm' }, { value: 'ft', label: 'ft · in' }]}
            value={heightUnit}
            onChange={setHeightUnit}
          />
        </View>
        {heightUnit === 'cm' ? (
          <TextInput
            style={styles.textInput}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="number-pad"
            placeholder="170 cm"
            placeholderTextColor={colors.textMuted}
          />
        ) : (
          <View style={styles.row}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={heightFt}
              onChangeText={setHeightFt}
              keyboardType="number-pad"
              placeholder="5 ft"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={heightIn}
              onChangeText={setHeightIn}
              keyboardType="number-pad"
              placeholder="7 in"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}
        {heightUnit === 'ft' && resolvedCm > 0 && (
          <Text style={styles.hint}>{resolvedCm} cm</Text>
        )}

        <Label>Current weight (kg)</Label>
        <TextInput
          style={styles.textInput}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 72.5"
          placeholderTextColor={colors.textMuted}
        />

        <Label>Goal weight (kg)</Label>
        <TextInput
          style={styles.textInput}
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="decimal-pad"
          placeholder="e.g. 65.0"
          placeholderTextColor={colors.textMuted}
        />

        {/* ── FITNESS GOALS ─────────────────────────── */}
        <SectionHeader title="Fitness goals" />

        <Label>Activity level</Label>
        <View style={styles.optionList}>
          {ACTIVITY_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.title}
              subtitle={o.subtitle}
              emoji={o.emoji}
              selected={activityLevel === o.value}
              onPress={() => setActivityLevel(o.value)}
            />
          ))}
        </View>

        <Label>Goal pace</Label>
        <View style={styles.optionList}>
          {PACE_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.title}
              subtitle={o.subtitle}
              emoji={o.emoji}
              selected={goalPace === o.value}
              onPress={() => setGoalPace(o.value)}
            />
          ))}
        </View>

        {/* ── DIET ──────────────────────────────────── */}
        <SectionHeader title="Diet" />

        <Label>Diet preference</Label>
        <View style={styles.optionList}>
          {DIET_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              title={o.title}
              subtitle={o.subtitle}
              emoji={o.emoji}
              selected={dietPref === o.value}
              onPress={() => setDietPref(o.value)}
            />
          ))}
        </View>

        <Label>Meals per day</Label>
        <Segment<MealsPerDay>
          options={[
            { value: 3, label: '3 meals' },
            { value: 4, label: '4 meals' },
            { value: 5, label: '5 meals' },
            { value: 6, label: '6 meals' },
          ]}
          value={mealsPerDay}
          onChange={setMealsPerDay}
        />

        <View style={styles.ifLabelRow}>
          <Text style={styles.label}>Intermittent fasting</Text>
          <TouchableOpacity
            onPress={() => setIfInfoVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <IFInfoModal visible={ifInfoVisible} onClose={() => setIfInfoVisible(false)} />
        <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
          {IF_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.ifCard, fastingProtocol === o.value && styles.ifCardSelected]}
              onPress={() => setFastingProtocol(o.value)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.ifLabel, fastingProtocol === o.value && styles.ifLabelSelected]}>{o.label}</Text>
                <Text style={styles.ifWindow}>{o.window}</Text>
                <Text style={styles.ifDesc}>{o.desc}</Text>
              </View>
              {fastingProtocol === o.value && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── DAILY SCHEDULE ────────────────────────── */}
        <SectionHeader title="Daily schedule" />

        <Label>Wake up time</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {WAKE_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, wakeTime === t && styles.chipSelected]}
              onPress={() => setWakeTime(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, wakeTime === t && styles.chipTextSelected]}>
                {fmt12(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Label>Bedtime</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {SLEEP_TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, sleepTime === t && styles.chipSelected]}
              onPress={() => setSleepTime(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, sleepTime === t && styles.chipTextSelected]}>
                {fmt12(t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Label>Daily water goal</Label>
        <Stepper value={waterGoal} min={4} max={20} onChange={setWaterGoal} unit="glasses" />

        {/* ── PLAN PREVIEW ──────────────────────────── */}
        {previewTargets && (
          <>
            <SectionHeader title="Plan preview" />
            <View style={[styles.previewCard, cardShadow]}>
              <PreviewRow
                label="Calories"
                oldVal={profile.calorieGoal}
                newVal={previewTargets.calorieGoal}
                unit="kcal/day"
              />
              <View style={styles.divider} />
              <PreviewRow
                label="Protein"
                oldVal={profile.proteinGoal}
                newVal={previewTargets.proteinGoal}
                unit="g/day"
              />
              <View style={styles.divider} />
              <PreviewRow
                label="TDEE"
                oldVal={null}
                newVal={previewTargets.tdee}
                unit="kcal"
              />
              {previewTargets.goalDate && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Projected goal date</Text>
                    <Text style={styles.previewNew}>{previewTargets.goalDate}</Text>
                  </View>
                </>
              )}
              {previewTargets.paceAdjusted && (
                <Text style={styles.previewNote}>
                  Pace adjusted to stay within safe limits.
                </Text>
              )}
            </View>
            <Text style={styles.previewDisclaimer}>
              Meal plan will be regenerated when you save.
            </Text>
          </>
        )}

        {/* ── SAVE ──────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving…' : 'Save & recalculate'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Small inline helpers ─────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit: string;
}
function Stepper({ value, min, max, onChange, unit }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - 1))}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.stepVal}>
        {value} <Text style={styles.stepUnit}>{unit}</Text>
      </Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + 1))}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

interface PreviewRowProps {
  label: string;
  oldVal: number | null;
  newVal: number;
  unit: string;
}
function PreviewRow({ label, oldVal, newVal, unit }: PreviewRowProps) {
  const changed = oldVal !== null && oldVal !== newVal;
  const up = oldVal !== null && newVal > oldVal;
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <View style={styles.previewRight}>
        {changed && oldVal !== null && (
          <Text style={styles.previewOld}>{oldVal}</Text>
        )}
        {changed && (
          <Ionicons
            name={up ? 'arrow-up' : 'arrow-down'}
            size={13}
            color={up ? colors.orange : colors.mint}
          />
        )}
        <Text style={[styles.previewNew, changed && { color: colors.primary }]}>
          {newVal} <Text style={styles.previewUnit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  row: { flexDirection: 'row', gap: spacing.sm },

  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  optionList: { gap: spacing.sm, marginBottom: spacing.sm },

  chipScroll: { marginBottom: spacing.sm },
  chipContainer: { paddingRight: spacing.lg, gap: spacing.sm, flexDirection: 'row' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: colors.primaryDark },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceHigh,
  },
  stepVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  previewRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  previewLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  previewOld: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through' },
  previewNew: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  previewUnit: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  previewNote: {
    fontSize: 12,
    color: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },

  previewDisclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ifLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  ifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ifCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ifLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  ifLabelSelected: { color: colors.primaryDark },
  ifWindow: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 2 },
  ifDesc: { fontSize: 12, color: colors.textSecondary },
});

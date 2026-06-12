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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, radius, spacing } from '../../theme';
import GradientButton from '../../components/ui/GradientButton';
import GradientProgressBar from '../../components/ui/GradientProgressBar';
import GradientCard from '../../components/ui/GradientCard';
import { NumberField, OptionCard, Segment } from './inputs';
import FadeSlideIn from '../../components/anim/FadeSlideIn';
import {
  ActivityLevel,
  DietPref,
  Gender,
  GoalPace,
  MealsPerDay,
  OnboardingAnswers,
} from '../../types';
import { computeTargets, PACE_KG_PER_WEEK } from '../../services/planGenerator';
import { useFitStore } from '../../store/useFitStore';
import { scheduleAllNotifications } from '../../services/notifications';
import { scheduleWidgetRefresh } from '../../widgets/updateWidget';

const TOTAL_STEPS = 10;

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; subtitle: string; emoji: string }[] = [
  { value: 'sedentary', title: 'Sedentary', subtitle: 'Desk job, little exercise', emoji: '🪑' },
  { value: 'light', title: 'Lightly active', subtitle: 'Light exercise 1–3 days/week', emoji: '🚶' },
  { value: 'moderate', title: 'Moderately active', subtitle: 'Exercise 3–5 days/week', emoji: '🏃' },
  { value: 'active', title: 'Active', subtitle: 'Hard exercise 6–7 days/week', emoji: '💪' },
  { value: 'veryActive', title: 'Very active', subtitle: 'Physical job + daily training', emoji: '🔥' },
];

const DIET_OPTIONS: { value: DietPref; title: string; subtitle: string; emoji: string }[] = [
  { value: 'veg', title: 'Vegetarian', subtitle: 'No meat, no eggs', emoji: '🥦' },
  { value: 'eggetarian', title: 'Eggetarian', subtitle: 'Vegetarian + eggs', emoji: '🥚' },
  { value: 'nonveg', title: 'Non-vegetarian', subtitle: 'Everything on the menu', emoji: '🍗' },
];

const PACE_OPTIONS: { value: GoalPace; title: string; subtitle: string; emoji: string }[] = [
  { value: 'gentle', title: 'Gentle', subtitle: '~0.25 kg per week', emoji: '🐢' },
  { value: 'steady', title: 'Steady', subtitle: '~0.5 kg per week', emoji: '🚶' },
  { value: 'aggressive', title: 'Aggressive', subtitle: '~0.75 kg per week', emoji: '🚀' },
];

const WAKE_TIMES = ['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];
const SLEEP_TIMES = ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'];

export default function OnboardingScreen() {
  const completeOnboarding = useFitStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [dietPref, setDietPref] = useState<DietPref>('nonveg');
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(4);
  const [goalPace, setGoalPace] = useState<GoalPace>('steady');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [waterGoal, setWaterGoal] = useState<number | null>(null);

  const answers: OnboardingAnswers | null = useMemo(() => {
    const a = parseInt(age, 10);
    const h = parseFloat(height);
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    if (!a || !h || !cw || !gw) return null;
    const base: OnboardingAnswers = {
      name: name.trim() || 'Friend',
      age: a,
      gender,
      heightCm: h,
      currentWeight: cw,
      goalWeight: gw,
      activityLevel,
      dietPref,
      mealsPerDay,
      goalPace,
      wakeTime,
      sleepTime,
      waterGoal: 8,
    };
    const targets = computeTargets(base);
    base.waterGoal = waterGoal ?? targets.waterGoal;
    return base;
  }, [name, age, gender, height, currentWeight, goalWeight, activityLevel, dietPref, mealsPerDay, goalPace, wakeTime, sleepTime, waterGoal]);

  const targets = useMemo(() => (answers ? computeTargets(answers) : null), [answers]);

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: {
        const a = parseInt(age, 10);
        return a >= 13 && a <= 100;
      }
      case 2: {
        const h = parseFloat(height);
        return h >= 100 && h <= 250;
      }
      case 3: {
        const w = parseFloat(currentWeight);
        return w >= 30 && w <= 300;
      }
      case 4: {
        const w = parseFloat(goalWeight);
        return w >= 30 && w <= 300;
      }
      default: return true;
    }
  };

  const finish = () => {
    if (!answers) {
      Alert.alert('Missing info', 'Please fill in all the questions first.');
      return;
    }
    completeOnboarding(answers);
    const { mealPlan, exercisePlan, profile } = useFitStore.getState();
    scheduleAllNotifications(mealPlan, exercisePlan, profile).catch(console.warn);
    scheduleWidgetRefresh();
    // Routing flips to the main app automatically (profile.onboarded === true).
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepWrap title="What's your name?" subtitle="So we know what to call you.">
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={30}
            />
          </StepWrap>
        );
      case 1:
        return (
          <StepWrap title="About you" subtitle="Used to calculate your daily calorie needs.">
            <Text style={styles.fieldLabel}>Age</Text>
            <NumberField value={age} onChange={setAge} unit="years" />
            <Text style={[styles.fieldLabel, { marginTop: spacing.xxl }]}>Gender</Text>
            <Segment
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              value={gender}
              onChange={setGender}
            />
          </StepWrap>
        );
      case 2:
        return (
          <StepWrap title="How tall are you?" subtitle="Height drives the calorie formula.">
            <NumberField value={height} onChange={setHeight} unit="cm" placeholder="170" autoFocus />
          </StepWrap>
        );
      case 3:
        return (
          <StepWrap title="Current weight" subtitle="Your starting point.">
            <NumberField value={currentWeight} onChange={setCurrentWeight} unit="kg" placeholder="80" autoFocus />
          </StepWrap>
        );
      case 4:
        return (
          <StepWrap title="Goal weight" subtitle="Where do you want to be?">
            <NumberField value={goalWeight} onChange={setGoalWeight} unit="kg" placeholder="70" autoFocus />
            {answers && (
              <Text style={styles.hint}>
                {answers.goalWeight < answers.currentWeight
                  ? `Losing ${(answers.currentWeight - answers.goalWeight).toFixed(1)} kg 📉`
                  : answers.goalWeight > answers.currentWeight
                  ? `Gaining ${(answers.goalWeight - answers.currentWeight).toFixed(1)} kg 📈`
                  : 'Maintaining your weight ⚖️'}
              </Text>
            )}
          </StepWrap>
        );
      case 5:
        return (
          <StepWrap title="Activity level" subtitle="How active is a normal week?">
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
          </StepWrap>
        );
      case 6:
        return (
          <StepWrap title="Food preferences" subtitle="Your meal plan is built around this.">
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
            <Text style={[styles.fieldLabel, { marginTop: spacing.xxl }]}>Meals per day</Text>
            <Segment
              options={[
                { value: 3 as MealsPerDay, label: '3' },
                { value: 4 as MealsPerDay, label: '4' },
                { value: 5 as MealsPerDay, label: '5' },
                { value: 6 as MealsPerDay, label: '6' },
              ]}
              value={mealsPerDay}
              onChange={setMealsPerDay}
            />
          </StepWrap>
        );
      case 7: {
        const maintaining = answers
          ? Math.abs(answers.goalWeight - answers.currentWeight) < 2
          : false;
        return (
          <StepWrap title="How fast?" subtitle="A slower pace is easier to stick to.">
            {maintaining ? (
              <Text style={styles.hint}>
                You're maintaining weight — pace doesn't apply. Continue!
              </Text>
            ) : (
              <View style={styles.optionList}>
                {PACE_OPTIONS.map((o) => {
                  const preview =
                    answers && targets && goalPace === o.value
                      ? targets.goalDate
                        ? `≈ ${targets.calorieGoal} kcal/day · goal by ${dayjs(targets.goalDate).format('D MMM YYYY')}`
                        : `≈ ${targets.calorieGoal} kcal/day`
                      : `${PACE_KG_PER_WEEK[o.value]} kg/week`;
                  return (
                    <OptionCard
                      key={o.value}
                      title={o.title}
                      subtitle={preview}
                      emoji={o.emoji}
                      selected={goalPace === o.value}
                      onPress={() => setGoalPace(o.value)}
                    />
                  );
                })}
              </View>
            )}
            {targets?.paceAdjusted && (
              <Text style={styles.warn}>
                ⚠️ Pace auto-adjusted to keep your calories at a safe level.
              </Text>
            )}
          </StepWrap>
        );
      }
      case 8:
        return (
          <StepWrap title="Your day" subtitle="Meal times and reminders follow your schedule.">
            <Text style={styles.fieldLabel}>I usually wake up at</Text>
            <View style={styles.timeRow}>
              {WAKE_TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, wakeTime === t && styles.timeChipSelected]}
                  onPress={() => setWakeTime(t)}
                >
                  <Text style={[styles.timeChipText, wakeTime === t && styles.timeChipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>I usually sleep at</Text>
            <View style={styles.timeRow}>
              {SLEEP_TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, sleepTime === t && styles.timeChipSelected]}
                  onPress={() => setSleepTime(t)}
                >
                  <Text style={[styles.timeChipText, sleepTime === t && styles.timeChipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>
              Daily water goal (glasses of 250 ml)
            </Text>
            <View style={styles.waterRow}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setWaterGoal(Math.max((waterGoal ?? targets?.waterGoal ?? 8) - 1, 4))}
              >
                <Ionicons name="remove" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.waterValue}>{waterGoal ?? targets?.waterGoal ?? 8}</Text>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setWaterGoal(Math.min((waterGoal ?? targets?.waterGoal ?? 8) + 1, 16))}
              >
                <Ionicons name="add" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Recommended for your weight: {targets?.waterGoal ?? 8} glasses
            </Text>
          </StepWrap>
        );
      case 9:
        return (
          <StepWrap title={`You're all set, ${name.trim() || 'Friend'}!`} subtitle="Here's your personalized plan.">
            {targets && answers && (
              <View style={{ gap: spacing.md }}>
                <GradientCard accent>
                  <View style={styles.summaryRow}>
                    <SummaryStat label="Daily calories" value={`${targets.calorieGoal}`} unit="kcal" />
                    <SummaryStat label="Protein" value={`${targets.proteinGoal}`} unit="g" />
                    <SummaryStat label="Water" value={`${answers.waterGoal}`} unit="glasses" />
                  </View>
                </GradientCard>
                <GradientCard>
                  <SummaryLine label="BMR (resting burn)" value={`${targets.bmr} kcal`} />
                  <SummaryLine label="TDEE (daily burn)" value={`${targets.tdee} kcal`} />
                  <SummaryLine
                    label="Daily adjustment"
                    value={`${targets.dailyDelta > 0 ? '+' : ''}${targets.dailyDelta} kcal`}
                  />
                  {targets.goalDate && (
                    <SummaryLine
                      label={`Goal of ${answers.goalWeight} kg`}
                      value={`~ ${dayjs(targets.goalDate).format('D MMM YYYY')}`}
                    />
                  )}
                  <SummaryLine
                    label="Meal plan"
                    value={`${answers.mealsPerDay} meals · ${DIET_OPTIONS.find((d) => d.value === answers.dietPref)?.title}`}
                  />
                </GradientCard>
                {targets.paceAdjusted && (
                  <Text style={styles.warn}>
                    ⚠️ Your pace was adjusted to keep calories at a safe minimum.
                  </Text>
                )}
              </View>
            )}
          </StepWrap>
        );
      default:
        return null;
    }
  };

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <GradientProgressBar progress={(step + 1) / TOTAL_STEPS} height={6} style={{ flex: 1 }} />
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeSlideIn key={step}>{renderStep()}</FadeSlideIn>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            title={isLast ? 'Start my journey 🚀' : 'Continue'}
            onPress={() => (isLast ? finish() : setStep(step + 1))}
            disabled={!canContinue()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepWrap({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={{ marginTop: spacing.xxl }}>{children}</View>
    </View>
  );
}

function SummaryStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLineLabel}>{label}</Text>
      <Text style={styles.summaryLineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 32, alignItems: 'flex-start' },
  stepCount: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, width: 40, textAlign: 'right' },
  content: { padding: spacing.xl, paddingBottom: 24 },
  footer: { padding: spacing.xl, paddingTop: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 21 },
  nameInput: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  optionList: { gap: spacing.md },
  hint: { fontSize: 14, color: colors.primary, marginTop: spacing.lg, textAlign: 'center', fontWeight: '600' },
  warn: { fontSize: 13, color: '#D98E00', marginTop: spacing.lg, textAlign: 'center' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  timeChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  timeChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  timeChipTextSelected: { color: colors.primaryDark },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  waterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterValue: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, minWidth: 64, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStat: { alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  summaryUnit: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLineLabel: { fontSize: 14, color: colors.textSecondary },
  summaryLineValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});

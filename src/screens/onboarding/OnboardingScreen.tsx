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
import IFInfoModal from '../../components/IFInfoModal';
import {
  ActivityLevel,
  DietPref,
  FastingProtocol,
  Gender,
  GoalPace,
  MealsPerDay,
  OnboardingAnswers,
} from '../../types';
import { computeTargets, PACE_KG_PER_WEEK } from '../../services/planGenerator';
import { useFitStore } from '../../store/useFitStore';
import { scheduleAllNotifications } from '../../services/notifications';
import { scheduleWidgetRefresh } from '../../widgets/updateWidget';

const TOTAL_STEPS = 11;

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

const WAKE_TIMES = [
  '04:00','04:30','05:00','05:30','06:00','06:30',
  '07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00',
];
const SLEEP_TIMES = [
  '20:00','20:30','21:00','21:30','22:00','22:30',
  '23:00','23:30','00:00','00:30','01:00','01:30','02:00',
];
const GOAL_PRESETS = [1, 2, 3, 6, 12, 18, 24];

const IF_OPTIONS: { value: FastingProtocol; label: string; window: string; desc: string }[] = [
  { value: 'none', label: 'No fasting', window: 'All day', desc: 'Eat anytime within your schedule' },
  { value: '16:8', label: '16:8', window: '12 pm – 8 pm', desc: 'Fast 16h, eat in an 8-hour window' },
  { value: '18:6', label: '18:6', window: '1 pm – 7 pm', desc: 'Fast 18h, eat in a 6-hour window' },
  { value: '20:4', label: '20:4', window: '2 pm – 6 pm', desc: 'Fast 20h, eat in a 4-hour window' },
];

const fmt12 = (t: string) => {
  const [hh, mm] = t.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${h12}:${mm.toString().padStart(2, '0')} ${ampm}`;
};

export default function OnboardingScreen() {
  const completeOnboarding = useFitStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<Gender>('male');

  // Height
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [height, setHeight] = useState('');   // cm value
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [dietPref, setDietPref] = useState<DietPref>('nonveg');
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(4);
  const [goalPace, setGoalPace] = useState<GoalPace>('steady');
  const [fastingProtocol, setFastingProtocol] = useState<FastingProtocol>('none');
  const [ifInfoVisible, setIfInfoVisible] = useState(false);

  // Goal date
  const [goalDateMonths, setGoalDateMonths] = useState(6);
  const [goalDateChoice, setGoalDateChoice] = useState<'user' | 'app'>('app');

  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [waterGoal, setWaterGoal] = useState<number | null>(null);

  const heightCm = useMemo(() => {
    if (heightUnit === 'cm') return parseFloat(height) || 0;
    const ft = parseInt(heightFt || '0', 10);
    const inches = parseInt(heightIn || '0', 10);
    return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
  }, [heightUnit, height, heightFt, heightIn]);

  const answers: OnboardingAnswers | null = useMemo(() => {
    const a = parseInt(age, 10);
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    if (!a || !heightCm || !cw || !gw) return null;
    const base: OnboardingAnswers = {
      name: name.trim() || 'Friend',
      age: a,
      gender,
      heightCm,
      currentWeight: cw,
      goalWeight: gw,
      activityLevel,
      dietPref,
      mealsPerDay,
      goalPace,
      wakeTime,
      sleepTime,
      waterGoal: 8,
      fastingProtocol,
    };
    const targets = computeTargets(base);
    base.waterGoal = waterGoal ?? targets.waterGoal;
    return base;
  }, [name, age, gender, heightCm, currentWeight, goalWeight, activityLevel, dietPref, mealsPerDay, goalPace, wakeTime, sleepTime, waterGoal, fastingProtocol]);

  const targets = useMemo(() => (answers ? computeTargets(answers) : null), [answers]);

  // Goal date calculations
  const weightDiff = useMemo(() => {
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    return isNaN(cw) || isNaN(gw) ? 0 : Math.abs(cw - gw);
  }, [currentWeight, goalWeight]);

  const userTargetDate = useMemo(() => dayjs().add(goalDateMonths, 'month'), [goalDateMonths]);
  const userWeeklyRate = useMemo(() => {
    const weeks = goalDateMonths * 4.33;
    return weeks > 0 ? weightDiff / weeks : 0;
  }, [goalDateMonths, weightDiff]);
  const riskLevel = useMemo(
    () => (userWeeklyRate > 1.0 ? 'high' : userWeeklyRate > 0.5 ? 'moderate' : 'safe'),
    [userWeeklyRate]
  );

  const appTargetDate = useMemo(
    () => (targets?.goalDate ? dayjs(targets.goalDate) : dayjs().add(6, 'month')),
    [targets]
  );

  const chosenGoalDate = useMemo(
    () => (goalDateChoice === 'user' ? userTargetDate : appTargetDate).format('YYYY-MM-DD'),
    [goalDateChoice, userTargetDate, appTargetDate]
  );

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: {
        const a = parseInt(age, 10);
        return a >= 13 && a <= 100;
      }
      case 2: return heightCm >= 100 && heightCm <= 250;
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
    completeOnboarding({ ...answers, goalDate: chosenGoalDate });
    const { mealPlan, exercisePlan, profile } = useFitStore.getState();
    scheduleAllNotifications(mealPlan, exercisePlan, profile).catch(console.warn);
    scheduleWidgetRefresh();
  };

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Name ──────────────────────────────────────────────────────
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

      // ── Step 1: Age / Gender ──────────────────────────────────────────────
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

      // ── Step 2: Height (cm OR ft/in) ──────────────────────────────────────
      case 2:
        return (
          <StepWrap title="How tall are you?" subtitle="Height drives the calorie formula.">
            <Segment
              options={[
                { value: 'cm', label: 'cm' },
                { value: 'ft', label: 'ft / in' },
              ]}
              value={heightUnit}
              onChange={(v) => { setHeightUnit(v as 'cm' | 'ft'); setHeight(''); setHeightFt(''); setHeightIn(''); }}
            />
            <View style={{ marginTop: spacing.xl }}>
              {heightUnit === 'cm' ? (
                <NumberField value={height} onChange={setHeight} unit="cm" placeholder="170" autoFocus />
              ) : (
                <View style={styles.ftRow}>
                  <View style={styles.ftField}>
                    <NumberField value={heightFt} onChange={setHeightFt} unit="ft" placeholder="5" autoFocus />
                  </View>
                  <View style={styles.ftField}>
                    <NumberField value={heightIn} onChange={setHeightIn} unit="in" placeholder="7" />
                  </View>
                </View>
              )}
            </View>
            {heightCm > 0 && heightUnit === 'ft' && (
              <Text style={styles.hint}>{heightCm} cm</Text>
            )}
          </StepWrap>
        );

      // ── Step 3: Current weight ─────────────────────────────────────────────
      case 3:
        return (
          <StepWrap title="Current weight" subtitle="Your starting point.">
            <NumberField value={currentWeight} onChange={setCurrentWeight} unit="kg" placeholder="80" autoFocus />
          </StepWrap>
        );

      // ── Step 4: Goal weight ────────────────────────────────────────────────
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

      // ── Step 5: Activity ───────────────────────────────────────────────────
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

      // ── Step 6: Diet / meals ───────────────────────────────────────────────
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
            <View style={styles.ifLabelRow}>
              <Text style={[styles.fieldLabel, { marginTop: 0, marginBottom: 0 }]}>Intermittent fasting</Text>
              <TouchableOpacity
                onPress={() => setIfInfoVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
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
            {fastingProtocol !== 'none' && (
              <Text style={styles.hint}>
                Meal times will be set within your eating window.
              </Text>
            )}
          </StepWrap>
        );

      // ── Step 7: Pace ───────────────────────────────────────────────────────
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

      // ── Step 8: Goal date (NEW) ────────────────────────────────────────────
      case 8: {
        const maintaining = weightDiff < 2;
        if (maintaining) {
          return (
            <StepWrap title="Goal timeline" subtitle="You're maintaining weight — no specific date needed.">
              <Text style={styles.hint}>Continue to set up your daily schedule.</Text>
            </StepWrap>
          );
        }
        return (
          <StepWrap
            title="When's your goal date?"
            subtitle="Set a target date to stay motivated."
          >
            {/* Quick presets */}
            <Text style={styles.fieldLabel}>Quick pick</Text>
            <View style={styles.timeRow}>
              {GOAL_PRESETS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timeChip, goalDateMonths === m && styles.timeChipSelected]}
                  onPress={() => setGoalDateMonths(m)}
                >
                  <Text style={[styles.timeChipText, goalDateMonths === m && styles.timeChipTextSelected]}>
                    {m < 12 ? `${m} mo` : `${m / 12} yr`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Month stepper */}
            <View style={[styles.waterRow, { marginTop: spacing.lg }]}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setGoalDateMonths((m) => Math.max(1, m - 1))}
              >
                <Ionicons name="remove" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', minWidth: 80 }}>
                <Text style={styles.waterValue}>{goalDateMonths}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>months</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  by {userTargetDate.format('D MMM YYYY')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setGoalDateMonths((m) => Math.min(36, m + 1))}
              >
                <Ionicons name="add" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Risk assessment */}
            {weightDiff > 0 && riskLevel !== 'safe' && (
              <GradientCard style={{ marginTop: spacing.lg }}>
                <Text style={[styles.riskTitle, { color: riskLevel === 'high' ? colors.red : '#D98E00' }]}>
                  {riskLevel === 'high' ? '🚨 High risk pace' : '⚠️ Moderate pace'}
                </Text>
                <Text style={styles.riskBody}>
                  Needs {userWeeklyRate.toFixed(2)} kg/week — safe limit is 0.5 kg/week
                </Text>
                {riskLevel === 'high' && (
                  <View style={{ marginTop: spacing.sm, gap: 3 }}>
                    {['Significant muscle loss', 'Nutritional deficiencies', 'Metabolic slowdown', 'Risk of gallstones', 'Chronic fatigue & weakness'].map((r) => (
                      <Text key={r} style={styles.riskBullet}>• {r}</Text>
                    ))}
                  </View>
                )}
              </GradientCard>
            )}

            {/* Two-choice cards */}
            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Choose your target</Text>
            <View style={styles.optionList}>
              <OptionCard
                title={`My date: ${userTargetDate.format('D MMM YYYY')}`}
                subtitle={weightDiff > 0 ? `${userWeeklyRate.toFixed(2)} kg/week needed` : 'Your chosen timeline'}
                emoji={riskLevel === 'high' ? '🚨' : riskLevel === 'moderate' ? '⚠️' : '🎯'}
                selected={goalDateChoice === 'user'}
                onPress={() => setGoalDateChoice('user')}
              />
              <OptionCard
                title={`App recommends: ${appTargetDate.format('D MMM YYYY')}`}
                subtitle={`${PACE_KG_PER_WEEK[goalPace]} kg/week · safe & sustainable`}
                emoji="✅"
                selected={goalDateChoice === 'app'}
                onPress={() => setGoalDateChoice('app')}
              />
            </View>
          </StepWrap>
        );
      }

      // ── Step 9: Your day ───────────────────────────────────────────────────
      case 9:
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
                    {fmt12(t)}
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
                    {fmt12(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>
              Daily water goal
            </Text>
            <View style={styles.waterRow}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setWaterGoal((v) => Math.max((v ?? targets?.waterGoal ?? 8) - 1, 4))}
              >
                <Ionicons name="remove" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.waterValue}>{waterGoal ?? targets?.waterGoal ?? 8}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>glasses</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>× 250 ml each</Text>
              </View>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setWaterGoal((v) => Math.min((v ?? targets?.waterGoal ?? 8) + 1, 20))}
              >
                <Ionicons name="add" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Recommended for your weight: {targets?.waterGoal ?? 8} glasses
            </Text>
          </StepWrap>
        );

      // ── Step 10: Summary ───────────────────────────────────────────────────
      case 10:
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
                  <SummaryLine
                    label={`Goal of ${answers.goalWeight} kg by`}
                    value={dayjs(chosenGoalDate).format('D MMM YYYY')}
                  />
                  <SummaryLine
                    label="Meal plan"
                    value={`${answers.mealsPerDay} meals · ${DIET_OPTIONS.find((d) => d.value === answers.dietPref)?.title}`}
                  />
                  {fastingProtocol !== 'none' && (
                    <SummaryLine
                      label="Fasting"
                      value={`${fastingProtocol} · ${IF_OPTIONS.find((o) => o.value === fastingProtocol)?.window ?? ''}`}
                    />
                  )}
                  <SummaryLine label="Wake up" value={fmt12(wakeTime)} />
                  <SummaryLine label="Sleep" value={fmt12(sleepTime)} />
                </GradientCard>
                {targets.paceAdjusted && (
                  <Text style={styles.warn}>
                    ⚠️ Your pace was adjusted to keep calories at a safe minimum.
                  </Text>
                )}
                {goalDateChoice === 'user' && riskLevel !== 'safe' && (
                  <Text style={styles.warn}>
                    {riskLevel === 'high' ? '🚨' : '⚠️'} Your goal date is aggressive — the app will still keep your daily calories safe.
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
      <IFInfoModal visible={ifInfoVisible} onClose={() => setIfInfoVisible(false)} />
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
  ftRow: { flexDirection: 'row', gap: spacing.xl, justifyContent: 'center' },
  ftField: { flex: 1, alignItems: 'center' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  timeChipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  timeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
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
  riskTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  riskBody: { fontSize: 13, color: colors.textSecondary },
  riskBullet: { fontSize: 12, color: colors.textSecondary },
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
  ifLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
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

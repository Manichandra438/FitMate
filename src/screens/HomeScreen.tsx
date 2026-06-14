import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { colors, gradients, radius, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import GlowRing from '../components/ui/GlowRing';
import StatTile from '../components/ui/StatTile';
import GradientCard from '../components/ui/GradientCard';
import SectionHeader from '../components/ui/SectionHeader';
import MealCard from '../components/MealCard';
import FadeSlideIn from '../components/anim/FadeSlideIn';
import WaterGlass from '../components/anim/WaterGlass';
import { useCountUp } from '../hooks/useCountUp';
import WeeklyReportModal from '../components/WeeklyReportModal';
import BackfillQuickAddModal from '../components/BackfillQuickAddModal';
import FastingTimerCard from '../components/FastingTimerCard';
import { computeBadges } from '../services/badges';
import { useStepCounter } from '../hooks/useStepCounter';
import { logKcal } from '../services/statsHelpers';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [reportVisible, setReportVisible] = useState(false);
  const [backfillVisible, setBackfillVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const {
    profile,
    logs,
    weightHistory,
    mealPlan,
    logWakeUp,
    addWater,
    removeWater,
    getTodayLog,
    getTodayTotals,
    getStreak,
    ensureTodayLog,
    getWeeklyBank,
    useStreakFreeze,
  } = useFitStore();

  useFocusEffect(
    useCallback(() => {
      ensureTodayLog();
      logWakeUp();
    }, [])
  );

  const log = getTodayLog();
  const { kcal, protein, carbs, fat } = getTodayTotals();
  const streak = getStreak();
  const isOverBudget = kcal > profile.calorieGoal;
  const displayKcal = isOverBudget ? kcal - profile.calorieGoal : profile.calorieGoal - kcal;
  const earnedBadges = computeBadges(profile, logs, weightHistory, streak).filter((b) => b.earned);
  const displayAnimated = useCountUp(displayKcal);
  const weeklyBank = getWeeklyBank();
  const { steps, available: stepsAvailable, kcalBurned } = useStepCounter();
  const todayBurned = (log.workouts ?? []).reduce((s, w) => s + w.kcalBurned, 0);
  const carbGoal = Math.round((profile.calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((profile.calorieGoal * 0.30) / 9);

  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const missedYesterday = useMemo(() => logKcal(logs[yesterday]) === 0, [logs, yesterday]);
  const freezeAvailable = !profile.streakFreezeUsedAt ||
    dayjs().diff(dayjs(profile.streakFreezeUsedAt), 'day') >= 7;

  const handleFreeze = () => {
    Alert.alert(
      'Use streak freeze?',
      "Protect your streak for missing yesterday. Recharges every 7 days.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🛡️ Freeze it',
          onPress: () => {
            const ok = useStreakFreeze();
            if (!ok) Alert.alert('Not available', 'Freeze recharges every 7 days.');
          },
        },
      ]
    );
  };

  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const now = dayjs();
  const nextMeal = mealPlan.find((meal) => {
    const mealLog = log.meals.find((m) => m.mealId === meal.id);
    if (mealLog?.logged || mealLog?.skipped) return false;
    const [h, m] = meal.time.split(':').map(Number);
    const mealTime = dayjs().hour(h).minute(m);
    return mealTime.isAfter(now);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={gradients.header}
        style={styles.headerGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeSlideIn>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {greeting}, {profile.name}
              </Text>
              <Text style={styles.subGreeting}>{dayjs().format('dddd, MMMM D')}</Text>
            </View>
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => setReportVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.reportBtnText}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.streakBadge}
              onPress={() => navigation.navigate('Tabs', { screen: 'Analytics', params: { initialTab: 'streaks' } })}
              activeOpacity={0.75}
            >
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>{streak}</Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        {/* FastingTimerCard */}
        <FastingTimerCard profile={profile} />

        {/* Missed yesterday banner */}
        {missedYesterday && !bannerDismissed && (
          <View style={styles.missedBanner}>
            <Text style={styles.missedEmoji}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.missedText}>No log for yesterday</Text>
              <Text style={styles.missedSub}>Tap to add what you ate</Text>
            </View>
            {freezeAvailable && streak > 0 && (
              <TouchableOpacity
                style={styles.freezeBtn}
                onPress={handleFreeze}
                activeOpacity={0.7}
              >
                <Text style={styles.freezeBtnText}>🛡️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.missedAddBtn}
              onPress={() => setBackfillVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.missedAddBtnText}>Add it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBannerDismissed(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Hero calorie ring */}
        <FadeSlideIn delay={60}>
          <View style={styles.heroWrap}>
            <GlowRing size={210} strokeWidth={16} progress={profile.calorieGoal ? kcal / profile.calorieGoal : 0}>
              <Text style={[styles.heroRemaining, isOverBudget && { color: colors.red }]}>
                {displayAnimated}
              </Text>
              <Text style={[styles.heroLabel, isOverBudget && { color: colors.red }]}>
                {isOverBudget ? 'kcal over' : 'kcal left'}
              </Text>
              <Text style={styles.heroSub}>
                {kcal} of {profile.calorieGoal}
              </Text>
            </GlowRing>
          </View>
        </FadeSlideIn>

        {/* Stat tiles */}
        <View style={styles.tiles}>
          <StatTile
            icon={<Ionicons name="barbell" size={18} color={colors.orange} />}
            value={`${protein}g`}
            label={`of ${profile.proteinGoal}g protein`}
            accentColor={colors.orange}
          />
          <StatTile
            icon={<Ionicons name="water" size={18} color={colors.blue} />}
            value={`${log.water}/${profile.waterGoal}`}
            label="glasses"
            accentColor={colors.blue}
            onPress={() => navigation.navigate('Water')}
          />
          <StatTile
            icon={<Ionicons name="scale" size={18} color={colors.teal} />}
            value={log.weight ? `${log.weight}` : `${profile.currentWeight}`}
            label="kg"
            accentColor={colors.teal}
            onPress={() => navigation.navigate('Progress')}
          />
        </View>

        {/* Macro breakdown */}
        {(carbs > 0 || fat > 0) && (
          <FadeSlideIn delay={90}>
            <GradientCard style={styles.macrosCard}>
              <Text style={styles.cardTitle}>🍽️ Macros today</Text>
              <View style={styles.macrosRow}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: colors.sun }]}>{carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: colors.orange }]}>{fat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroVal, { color: colors.primary }]}>{protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
              </View>
            </GradientCard>
          </FadeSlideIn>
        )}

        {/* Nutrition Progress bars */}
        <FadeSlideIn delay={95}>
          <GradientCard style={styles.nutriCard}>
            <Text style={styles.cardTitle}>📊 Nutrition Progress</Text>
            {[
              { label: 'Calories', value: kcal, goal: profile.calorieGoal, unit: 'kcal', color: colors.primary },
              { label: 'Protein', value: protein, goal: profile.proteinGoal, unit: 'g', color: colors.orange },
              { label: 'Carbs', value: carbs, goal: carbGoal, unit: 'g', color: colors.sky },
              { label: 'Fat', value: fat, goal: fatGoal, unit: 'g', color: colors.sun },
            ].map(({ label, value, goal, unit, color }) => {
              const pct = Math.min(goal > 0 ? value / goal : 0, 1);
              return (
                <View key={label} style={styles.nutriRow}>
                  <View style={styles.nutriLabelRow}>
                    <Text style={styles.nutriLabel}>{label}</Text>
                    <Text style={styles.nutriValue}>
                      {value}<Text style={styles.nutriGoal}>/{goal}{unit}</Text>
                    </Text>
                  </View>
                  <View style={styles.nutriTrack}>
                    <View style={[styles.nutriFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </GradientCard>
        </FadeSlideIn>

        {/* Weekly calorie bank */}
        <FadeSlideIn delay={100}>
          <GradientCard style={styles.bankCard}>
            <View style={styles.bankRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankTitle}>📅 Weekly Bank</Text>
                <Text style={styles.bankSub}>{weeklyBank.consumed} / {weeklyBank.budget} kcal this week</Text>
              </View>
              <View style={[styles.bankBadge, weeklyBank.bank < 0 && styles.bankBadgeOver]}>
                <Text style={[styles.bankBadgeText, weeklyBank.bank < 0 && { color: colors.red }]}>
                  {weeklyBank.bank >= 0 ? `+${weeklyBank.bank}` : weeklyBank.bank} kcal
                </Text>
              </View>
            </View>
          </GradientCard>
        </FadeSlideIn>

        {/* Step counter */}
        {stepsAvailable && (
          <FadeSlideIn delay={110}>
            <GradientCard style={styles.stepsCard}>
              <View style={styles.bankRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankTitle}>👟 Steps today</Text>
                  <Text style={styles.bankSub}>≈ {kcalBurned} kcal burned</Text>
                </View>
                <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
              </View>
            </GradientCard>
          </FadeSlideIn>
        )}

        {/* Today's Burn */}
        {todayBurned > 0 && (
          <FadeSlideIn delay={115}>
            <TouchableOpacity
              style={styles.burnCard}
              onPress={() => navigation.navigate('Exercise')}
              activeOpacity={0.8}
            >
              <Text style={styles.burnEmoji}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.burnTitle}>{todayBurned} kcal burned today</Text>
                <Text style={styles.burnSub}>
                  Net: {Math.max(kcal - todayBurned, 0)} kcal · {(log.workouts ?? []).length} workout{(log.workouts ?? []).length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.orange} />
            </TouchableOpacity>
          </FadeSlideIn>
        )}

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <FadeSlideIn delay={120}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.badgeScroll}
              contentContainerStyle={styles.badgeContainer}
            >
              {earnedBadges.map((b) => (
                <View key={b.id} style={styles.badgeChip}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                </View>
              ))}
            </ScrollView>
          </FadeSlideIn>
        )}

        {/* Water quick tap */}
        <GradientCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.cardTitle}>💧 Water</Text>
            <Text style={styles.waterCount}>
              {log.water}/{profile.waterGoal} glasses
            </Text>
          </View>
          <View style={styles.glassesRow}>
            {Array.from({ length: profile.waterGoal }).map((_, i) => (
              <WaterGlass
                key={i}
                filled={i < log.water}
                onPress={() => (i < log.water ? removeWater() : addWater())}
              />
            ))}
          </View>
        </GradientCard>

        {/* Next meal */}
        {nextMeal && (
          <GradientCard accent style={styles.nextMealCard}>
            <View style={styles.nextMealHeader}>
              <Text style={styles.nextMealLabel}>⏰ NEXT MEAL</Text>
              <Text style={styles.nextMealTime}>
                {(() => {
                  const [h, m] = nextMeal.time.split(':').map(Number);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
                })()}
              </Text>
            </View>
            <Text style={styles.nextMealName}>{nextMeal.name}</Text>
            <Text style={styles.nextMealFoods} numberOfLines={2}>
              {nextMeal.foods.map((f) => f.name).join(' · ')}
            </Text>
            <View style={styles.nextMealMacros}>
              <Text style={styles.nextMealKcal}>{nextMeal.totalKcal} kcal</Text>
              <Text style={styles.nextMealProtein}>
                {Math.round(nextMeal.totalProtein)}g protein
              </Text>
            </View>
          </GradientCard>
        )}

        {/* Exercise quick action */}
        <TouchableOpacity
          style={styles.exerciseRow}
          onPress={() => navigation.navigate('Exercise')}
          activeOpacity={0.7}
        >
          <View style={styles.exerciseIcon}>
            <Ionicons name="fitness" size={20} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseTitle}>
              {log.exercise.done ? 'Exercise done today 💪' : "Today's exercise"}
            </Text>
            <Text style={styles.exerciseSub}>
              {log.exercise.done
                ? `${log.exercise.activityName ?? ''} · ${log.exercise.duration ?? 0} min`
                : 'Tap to view & log'}
            </Text>
          </View>
          {log.exercise.done ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Today's meals */}
        <SectionHeader
          title="Today's meals"
          actionLabel="See all →"
          onAction={() => navigation.navigate('Meals')}
        />
        {mealPlan.slice(0, 4).map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            log={log.meals.find((m) => m.mealId === meal.id)}
            onPress={() => navigation.navigate('Meals')}
            compact
          />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      <WeeklyReportModal visible={reportVisible} onClose={() => setReportVisible(false)} />
      <BackfillQuickAddModal
        visible={backfillVisible}
        onClose={() => setBackfillVisible(false)}
        defaultDate={yesterday}
        onAdded={() => setBannerDismissed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  reportBtnText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sunSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.sun,
  },
  streakFire: { fontSize: 16 },
  streakText: { color: '#D98E00', fontSize: 15, fontWeight: '700' },
  badgeScroll: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
  badgeContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeEmoji: { fontSize: 14 },
  badgeTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  heroWrap: { alignItems: 'center', marginVertical: spacing.lg },
  heroRemaining: { fontSize: 44, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: -2 },
  heroSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  bankCard: { marginBottom: spacing.sm },
  stepsCard: { marginBottom: spacing.sm },
  bankRow: { flexDirection: 'row', alignItems: 'center' },
  bankTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  bankSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bankBadge: { backgroundColor: colors.mintSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.mint },
  bankBadgeOver: { backgroundColor: colors.redBg, borderColor: colors.red },
  bankBadgeText: { fontSize: 13, fontWeight: '700', color: colors.mint },
  stepsCount: { fontSize: 22, fontWeight: '800', color: colors.sky },
  waterCard: { marginBottom: spacing.md },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  waterCount: { color: colors.blue, fontSize: 14, fontWeight: '700' },
  glassesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  glassTap: { padding: 4 },
  glassIcon: { fontSize: 24 },
  nextMealCard: { marginBottom: spacing.md },
  nextMealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nextMealLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextMealTime: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  nextMealName: { color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginBottom: 4 },
  nextMealFoods: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  nextMealMacros: { flexDirection: 'row', gap: 14 },
  nextMealKcal: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  nextMealProtein: { color: colors.orange, fontSize: 13, fontWeight: '700' },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  exerciseSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  missedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sunSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sun,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  missedEmoji: { fontSize: 20 },
  missedText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  missedSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  missedAddBtn: {
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  missedAddBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  freezeBtn: {
    backgroundColor: colors.skySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.sky,
    marginRight: 4,
  },
  freezeBtnText: { fontSize: 14 },

  macrosCard: { marginBottom: spacing.sm },
  macrosRow: { flexDirection: 'row', alignItems: 'center' },
  macroItem: { flex: 1, alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  macroDivider: { width: 1, height: 32, backgroundColor: colors.border },

  nutriCard: { marginBottom: spacing.sm },
  nutriRow: { marginTop: spacing.sm },
  nutriLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nutriLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  nutriValue: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  nutriGoal: { fontSize: 11, fontWeight: '400', color: colors.textMuted },
  nutriTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  nutriFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },

  burnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.sunSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sun,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  burnEmoji: { fontSize: 28 },
  burnTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  burnSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

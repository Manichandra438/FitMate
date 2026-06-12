import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    profile,
    mealPlan,
    logWakeUp,
    addWater,
    removeWater,
    getTodayLog,
    getTodayTotals,
    getStreak,
    ensureTodayLog,
  } = useFitStore();

  useFocusEffect(
    useCallback(() => {
      ensureTodayLog();
      logWakeUp();
    }, [])
  );

  const log = getTodayLog();
  const { kcal, protein } = getTodayTotals();
  const streak = getStreak();
  const remaining = Math.max(profile.calorieGoal - kcal, 0);
  const remainingAnimated = useCountUp(remaining);

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
            <View>
              <Text style={styles.greeting}>
                {greeting}, {profile.name}
              </Text>
              <Text style={styles.subGreeting}>{dayjs().format('dddd, MMMM D')}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Hero calorie ring */}
        <FadeSlideIn delay={60}>
          <View style={styles.heroWrap}>
            <GlowRing size={210} strokeWidth={16} progress={profile.calorieGoal ? kcal / profile.calorieGoal : 0}>
              <Text style={styles.heroRemaining}>{remainingAnimated}</Text>
              <Text style={styles.heroLabel}>kcal left</Text>
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
  heroWrap: { alignItems: 'center', marginVertical: spacing.lg },
  heroRemaining: { fontSize: 44, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: -2 },
  heroSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
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
});

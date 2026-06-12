import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealLog, Meal } from '../types';
import { colors, radius, cardShadow } from '../theme';
import PressableScale from './anim/PressableScale';

interface Props {
  meal: Meal;
  log?: MealLog;
  onPress: () => void;
  compact?: boolean;
}

function mealEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('breakfast')) return '🌅';
  if (n.includes('lunch')) return '🥗';
  if (n.includes('dinner')) return '🌙';
  if (n.includes('snack')) return '🍎';
  return '🍽️';
}

export default function MealCard({ meal, log, onPress, compact }: Props) {
  const isLogged = log?.logged;
  const isSkipped = log?.skipped;
  const isPending = !isLogged && !isSkipped;

  const [hour, min] = meal.time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const timeStr = `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;

  return (
    <PressableScale
      style={[
        styles.card,
        cardShadow,
        isLogged && styles.cardLogged,
        isSkipped && styles.cardSkipped,
        compact && styles.cardCompact,
      ]}
      onPress={onPress}
    >
      <View style={[styles.emojiWrap, isLogged && styles.emojiWrapLogged]}>
        <Text style={styles.emoji}>{mealEmoji(meal.name)}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.name}>{meal.name}</Text>
        {!compact && (
          <Text style={styles.foods} numberOfLines={1}>
            {meal.foods.map((f) => f.name).join(' · ')}
          </Text>
        )}
        <Text style={styles.time}>{timeStr}</Text>
      </View>
      <View style={styles.right}>
        {isLogged ? (
          <View style={[styles.statusChip, { backgroundColor: colors.mintSoft }]}>
            <Ionicons name="checkmark" size={12} color={colors.mint} />
            <Text style={[styles.statusChipText, { color: colors.mint }]}>Done</Text>
          </View>
        ) : isSkipped ? (
          <View style={[styles.statusChip, { backgroundColor: colors.redBg }]}>
            <Text style={[styles.statusChipText, { color: colors.red }]}>Skipped</Text>
          </View>
        ) : null}
        <Text style={[styles.kcal, isLogged && { color: colors.mint }]}>
          {isLogged ? log?.totalKcal : meal.totalKcal} kcal
        </Text>
        <Text style={styles.protein}>
          {isLogged
            ? Math.round(log?.totalProtein ?? 0)
            : Math.round(meal.totalProtein)}
          g protein
        </Text>
        {isPending && (
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardCompact: {
    padding: 10,
    marginBottom: 6,
  },
  cardLogged: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
  },
  cardSkipped: {
    borderColor: colors.border,
    opacity: 0.55,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiWrapLogged: {
    backgroundColor: colors.surface,
  },
  emoji: { fontSize: 22 },
  middle: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  foods: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  time: { color: colors.textSecondary, fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 3 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  kcal: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  protein: { color: colors.textSecondary, fontSize: 11 },
});

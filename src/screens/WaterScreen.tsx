import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../types';
import { colors } from '../theme';
import { useFitStore } from '../store/useFitStore';
import ConfettiBurst, { ConfettiBurstHandle } from '../components/anim/ConfettiBurst';
import { success, tap } from '../utils/haptics';
import { useRef } from 'react';

export default function WaterScreen() {
  const { profile, addWater, removeWater, getTodayLog, ensureTodayLog } =
    useFitStore();
  const confetti = useRef<ConfettiBurstHandle>(null);

  useFocusEffect(useCallback(() => { ensureTodayLog(); }, []));

  const log = getTodayLog();
  const glasses = log.water;
  const goal = profile.waterGoal;
  const mlTotal = glasses * 250;
  const pct = Math.round((glasses / goal) * 100);

  const handleAdd = () => {
    tap();
    addWater();
    if (glasses + 1 >= goal) {
      success();
      confetti.current?.burst();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💧 Water</Text>
          <Text style={styles.subtitle}>Daily goal: {goal * 250} ml ({goal} glasses)</Text>
        </View>

        {/* Big display */}
        <View style={styles.mainCard}>
          <Text style={styles.bigNumber}>{glasses}</Text>
          <Text style={styles.bigUnit}>/ {goal} glasses</Text>
          <Text style={styles.mlText}>{mlTotal} ml · {pct}%</Text>

          {/* Glasses grid */}
          <View style={styles.glassGrid}>
            {Array.from({ length: goal }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.glassBtn,
                  i < glasses ? styles.glassFilled : styles.glassEmpty,
                ]}
                onPress={() => (i < glasses ? removeWater() : handleAdd())}
                activeOpacity={0.7}
              >
                <Text style={styles.glassEmoji}>{i < glasses ? '💧' : '○'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.minusBtn]}
            onPress={removeWater}
            disabled={glasses === 0}
          >
            <Ionicons name="remove" size={24} color={glasses === 0 ? COLORS.border : COLORS.red} />
            <Text style={[styles.controlText, { color: glasses === 0 ? COLORS.border : COLORS.red }]}>
              Remove glass
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.plusBtn]}
            onPress={handleAdd}
            disabled={glasses >= goal}
          >
            <Ionicons
              name="add"
              size={24}
              color={glasses >= goal ? COLORS.border : COLORS.blue}
            />
            <Text style={[styles.controlText, { color: glasses >= goal ? COLORS.border : COLORS.blue }]}>
              Add glass (250ml)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress message */}
        <View style={styles.messageCard}>
          {glasses === 0 && (
            <Text style={styles.message}>Start your day with a glass of water! 💪</Text>
          )}
          {glasses > 0 && glasses < goal / 2 && (
            <Text style={styles.message}>Keep going — you're {goal - glasses} glasses away!</Text>
          )}
          {glasses >= goal / 2 && glasses < goal && (
            <Text style={styles.message}>Over halfway! Just {goal - glasses} more. 🔥</Text>
          )}
          {glasses >= goal && (
            <Text style={[styles.message, { color: COLORS.green }]}>
              Goal achieved! Great job staying hydrated today! ✅
            </Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Hydration tips</Text>
          {[
            'Drink a glass first thing in the morning',
            'Sip water before each meal',
            'Keep a bottle on your desk during work shifts',
            'Warm water with jeera before bed (as planned!)',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
      <ConfettiBurst ref={confetti} />
    </View>
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
  mainCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.blue,
    lineHeight: 80,
  },
  bigUnit: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginBottom: 4,
  },
  mlText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  glassBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  glassFilled: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  glassEmpty: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
  },
  glassEmoji: {
    fontSize: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  controlBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  minusBtn: {
    backgroundColor: colors.redBg,
    borderColor: colors.red,
  },
  plusBtn: {
    backgroundColor: colors.skySoft,
    borderColor: colors.sky,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    color: COLORS.blue,
    fontSize: 14,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

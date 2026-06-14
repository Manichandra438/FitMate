import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import dayjs from 'dayjs';
import { colors, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { logKcal } from '../services/statsHelpers';

const CHART_W = 320;
const CHART_H = 140;
const BAR_W = 28;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 28;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

export default function CalorieBalanceChart() {
  const { logs, profile } = useFitStore();
  const goal = profile.calorieGoal;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
    const kcal = logKcal(logs[date]);
    return { date, kcal, label: dayjs(date).format('dd') };
  });

  const maxKcal = Math.max(goal * 1.2, ...days.map((d) => d.kcal));
  const toY = (k: number) => PLOT_H - (k / maxKcal) * PLOT_H;
  const goalY = toY(goal);

  const slotW = PLOT_W / 7;

  return (
    <View style={styles.wrap}>
      <Svg width={CHART_W} height={CHART_H} style={{ overflow: 'visible' }}>
        {/* Goal line */}
        <Line
          x1={PAD_L}
          y1={PAD_T + goalY}
          x2={PAD_L + PLOT_W}
          y2={PAD_T + goalY}
          stroke={colors.primary}
          strokeWidth={1}
          strokeDasharray="4,3"
          opacity={0.6}
        />
        <SvgText
          x={PAD_L - 4}
          y={PAD_T + goalY + 4}
          textAnchor="end"
          fontSize={9}
          fill={colors.primary}
        >
          {Math.round(goal / 100) * 100}
        </SvgText>

        {/* Y-axis zero */}
        <Line
          x1={PAD_L}
          y1={PAD_T + PLOT_H}
          x2={PAD_L + PLOT_W}
          y2={PAD_T + PLOT_H}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Bars */}
        {days.map((d, i) => {
          if (d.kcal === 0) {
            return (
              <G key={d.date}>
                <SvgText
                  x={PAD_L + slotW * i + slotW / 2}
                  y={PAD_T + PLOT_H - 2}
                  textAnchor="middle"
                  fontSize={9}
                  fill={colors.textMuted}
                >
                  —
                </SvgText>
                <SvgText
                  x={PAD_L + slotW * i + slotW / 2}
                  y={PAD_T + PLOT_H + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill={colors.textSecondary}
                >
                  {d.label}
                </SvgText>
              </G>
            );
          }

          const barH = Math.max((d.kcal / maxKcal) * PLOT_H, 4);
          const overGoal = d.kcal > goal;
          const barColor = overGoal ? colors.orange : colors.primary;
          const x = PAD_L + slotW * i + (slotW - BAR_W) / 2;
          const y = PAD_T + PLOT_H - barH;

          return (
            <G key={d.date}>
              <Rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={6}
                fill={barColor}
                opacity={0.85}
              />
              <SvgText
                x={x + BAR_W / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={8}
                fill={barColor}
                fontWeight="bold"
              >
                {d.kcal >= 1000 ? `${(d.kcal / 1000).toFixed(1)}k` : d.kcal}
              </SvgText>
              <SvgText
                x={x + BAR_W / 2}
                y={PAD_T + PLOT_H + 16}
                textAnchor="middle"
                fontSize={9}
                fill={colors.textSecondary}
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Under goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.orange }]} />
          <Text style={styles.legendText}>Over goal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dash, { borderColor: colors.primary }]} />
          <Text style={styles.legendText}>{goal} kcal target</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.sm },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dash: { width: 14, height: 0, borderBottomWidth: 1.5, borderStyle: 'dashed' },
  legendText: { fontSize: 11, color: colors.textSecondary },
});

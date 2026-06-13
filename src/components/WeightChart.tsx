import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { COLORS, WeightEntry } from '../types';
import { colors } from '../theme';
import dayjs from 'dayjs';

interface Props {
  data: WeightEntry[];
  goalWeight: number;
  height?: number;
}

const W = Dimensions.get('window').width - 48;
const PAD = { top: 20, right: 36, bottom: 30, left: 40 };

function linearRegression(data: WeightEntry[]): { slope: number; intercept: number } | null {
  const n = data.length;
  if (n < 2) return null;
  const startDate = dayjs(data[0].date);
  const xs = data.map((d) => dayjs(d.date).diff(startDate, 'day'));
  const ys = data.map((d) => d.weight);
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  if (den === 0) return null;
  return { slope: num / den, intercept: yMean - (num / den) * xMean };
}

function computeProjectedDate(data: WeightEntry[], goalWeight: number): string | null {
  if (data.length < 2) return null;
  const reg = linearRegression(data);
  if (!reg) return null;
  const { slope, intercept } = reg;
  if (Math.abs(slope) < 0.001) return null;
  const startDate = dayjs(data[0].date);
  const lastX = dayjs(data[data.length - 1].date).diff(startDate, 'day');
  const lastPredicted = slope * lastX + intercept;
  if (slope >= 0 && goalWeight < lastPredicted) return null;
  if (slope <= 0 && goalWeight > lastPredicted) return null;
  const goalX = (goalWeight - intercept) / slope;
  const daysLeft = Math.ceil(goalX - lastX);
  if (daysLeft <= 0 || daysLeft > 730) return null;
  return dayjs(data[data.length - 1].date).add(daysLeft, 'day').format('YYYY-MM-DD');
}

export default function WeightChart({ data, goalWeight, height = 220 }: Props) {
  if (data.length < 1) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Log your weight to see the chart</Text>
      </View>
    );
  }

  const projectedDate = computeProjectedDate(data, goalWeight);

  const chartW = W - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  // Date-based X axis so projected point lands at the right position
  const minDate = dayjs(data[0].date);
  const lastActualDate = dayjs(data[data.length - 1].date);
  const projDate = projectedDate ? dayjs(projectedDate) : null;
  const maxDate = projDate && projDate.isAfter(lastActualDate) ? projDate : lastActualDate;
  const totalDays = Math.max(maxDate.diff(minDate, 'day'), 1);

  const toX = (dateStr: string) => {
    const days = dayjs(dateStr).diff(minDate, 'day');
    return PAD.left + (days / totalDays) * chartW;
  };

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights, goalWeight) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;
  const toY = (w: number) => PAD.top + ((maxW - w) / range) * chartH;

  let pathD = '';
  data.forEach((entry, i) => {
    const x = toX(entry.date);
    const y = toY(entry.weight);
    pathD += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });

  const lastEntry = data[data.length - 1];
  const lastX = toX(lastEntry.date);
  const lastY = toY(lastEntry.weight);
  const projX = projectedDate ? toX(projectedDate) : null;
  const projY = projectedDate ? toY(goalWeight) : null;
  const goalY = toY(goalWeight);

  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = minW + (range / ySteps) * i;
    return { val: Math.round(val), y: toY(val) };
  });

  const xLabels: { label: string; x: number }[] = [];
  xLabels.push({ label: dayjs(data[0].date).format('MMM D'), x: toX(data[0].date) });
  if (data.length > 2) {
    const mid = data[Math.floor(data.length / 2)];
    xLabels.push({ label: dayjs(mid.date).format('MMM D'), x: toX(mid.date) });
  }
  if (data.length > 1) {
    xLabels.push({ label: dayjs(lastEntry.date).format('MMM D'), x: toX(lastEntry.date) });
  }

  return (
    <View>
      <Svg width={W} height={height}>
        {/* Y grid */}
        {yLabels.map((l) => (
          <React.Fragment key={l.val}>
            <Line x1={PAD.left} y1={l.y} x2={PAD.left + chartW} y2={l.y}
              stroke={COLORS.border} strokeWidth={1} strokeDasharray="4,4" />
            <SvgText x={PAD.left - 6} y={l.y + 4} fill={COLORS.textSecondary} fontSize={10} textAnchor="end">
              {l.val}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Goal line */}
        <Line x1={PAD.left} y1={goalY} x2={PAD.left + chartW} y2={goalY}
          stroke={colors.sun} strokeWidth={1.5} strokeDasharray="6,3" />
        <SvgText x={PAD.left + chartW + 2} y={goalY + 4} fill={colors.sun} fontSize={9}>
          Goal
        </SvgText>

        {/* Projection dashed line */}
        {projX !== null && projY !== null && (
          <Line x1={lastX} y1={lastY} x2={projX} y2={projY}
            stroke={colors.primary} strokeWidth={1.5}
            strokeDasharray="5,4" strokeOpacity={0.4} />
        )}

        {/* Actual line */}
        <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data dots */}
        {data.map((entry) => (
          <Circle key={entry.date} cx={toX(entry.date)} cy={toY(entry.weight)}
            r={4} fill={colors.primary} stroke={colors.surface} strokeWidth={2} />
        ))}

        {/* Projected endpoint dot + label */}
        {projX !== null && projY !== null && projectedDate && (
          <>
            <Circle cx={projX} cy={projY} r={5} fill={colors.sun} stroke={colors.surface} strokeWidth={2} />
            <SvgText x={projX} y={projY - 9} fill={colors.sun} fontSize={9} textAnchor="middle">
              {dayjs(projectedDate).format('MMM D')}
            </SvgText>
          </>
        )}

        {/* X labels */}
        {xLabels.map((l) => (
          <SvgText key={l.label} x={l.x} y={height - 4} fill={COLORS.textSecondary} fontSize={10} textAnchor="middle">
            {l.label}
          </SvgText>
        ))}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Your weight</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.sun }]} />
          <Text style={styles.legendText}>Goal ({goalWeight} kg)</Text>
        </View>
        {projectedDate && (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.4 }]} />
            <Text style={styles.legendText}>Predicted {dayjs(projectedDate).format('MMM D')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  legend: { flexDirection: 'row', gap: 16, paddingLeft: PAD.left, marginTop: 4, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textSecondary, fontSize: 12 },
});

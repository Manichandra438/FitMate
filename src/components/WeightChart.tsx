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
const PAD = { top: 20, right: 16, bottom: 30, left: 40 };

export default function WeightChart({ data, goalWeight, height = 200 }: Props) {
  if (data.length < 1) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Log your weight to see the chart</Text>
      </View>
    );
  }

  const chartW = W - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights, goalWeight) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;

  const toX = (i: number) =>
    PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;

  const toY = (w: number) =>
    PAD.top + ((maxW - w) / range) * chartH;

  // Build SVG path
  let pathD = '';
  data.forEach((entry, i) => {
    const x = toX(i);
    const y = toY(entry.weight);
    pathD += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });

  // Goal line Y
  const goalY = toY(goalWeight);

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = minW + (range / ySteps) * i;
    return { val: Math.round(val), y: toY(val) };
  });

  // X-axis labels (show first, last, and one middle)
  const xLabels: { label: string; x: number }[] = [];
  if (data.length >= 1) {
    xLabels.push({ label: dayjs(data[0].date).format('MMM D'), x: toX(0) });
    if (data.length > 2) {
      const mid = Math.floor(data.length / 2);
      xLabels.push({ label: dayjs(data[mid].date).format('MMM D'), x: toX(mid) });
    }
    if (data.length > 1) {
      xLabels.push({
        label: dayjs(data[data.length - 1].date).format('MMM D'),
        x: toX(data.length - 1),
      });
    }
  }

  return (
    <View>
      <Svg width={W} height={height}>
        {/* Y grid lines */}
        {yLabels.map((l) => (
          <React.Fragment key={l.val}>
            <Line
              x1={PAD.left}
              y1={l.y}
              x2={PAD.left + chartW}
              y2={l.y}
              stroke={COLORS.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD.left - 6}
              y={l.y + 4}
              fill={COLORS.textSecondary}
              fontSize={10}
              textAnchor="end"
            >
              {l.val}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Goal line */}
        <Line
          x1={PAD.left}
          y1={goalY}
          x2={PAD.left + chartW}
          y2={goalY}
          stroke={colors.sun}
          strokeWidth={1.5}
          strokeDasharray="6,3"
        />
        <SvgText
          x={PAD.left + chartW + 2}
          y={goalY + 4}
          fill={colors.sun}
          fontSize={9}
        >
          Goal
        </SvgText>

        {/* Weight line */}
        <Path
          d={pathD}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((entry, i) => (
          <Circle
            key={entry.date}
            cx={toX(i)}
            cy={toY(entry.weight)}
            r={4}
            fill={colors.primary}
            stroke={colors.surface}
            strokeWidth={2}
          />
        ))}

        {/* X labels */}
        {xLabels.map((l) => (
          <SvgText
            key={l.label}
            x={l.x}
            y={height - 4}
            fill={COLORS.textSecondary}
            fontSize={10}
            textAnchor="middle"
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Your weight</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.sun }]} />
          <Text style={styles.legendText}>Goal ({goalWeight} kg)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingLeft: PAD.left,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

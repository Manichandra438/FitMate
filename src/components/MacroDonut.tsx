import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

interface Segment { label: string; value: number; color: string; }

interface Props {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
}

export default function MacroDonut({ segments, size = 120, strokeWidth = 18 }: Props) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = seg.value / total;
    const dash = frac * circ;
    const arc = { ...seg, dashArray: circ, dashOffset: circ - dash, rotation: -90 + offset * 360 };
    offset += frac;
    return arc;
  });

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {arcs.map((arc, i) => (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={arc.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            transform={`rotate(${arc.rotation} ${size / 2} ${size / 2})`}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel}>{seg.label}</Text>
            <Text style={styles.legendVal}>{Math.round(seg.value)}g</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  legendVal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});

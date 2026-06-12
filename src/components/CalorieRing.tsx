import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../types';

interface Props {
  consumed: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({ consumed, goal, size = 140 }: Props) {
  const radius = (size - 24) / 2;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  const color =
    progress >= 1
      ? COLORS.orange
      : progress >= 0.75
      ? COLORS.yellow
      : COLORS.green;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.consumed, { color }]}>{consumed}</Text>
        <Text style={styles.label}>/ {goal}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumed: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.green,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  unit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

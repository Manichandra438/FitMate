import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface Props {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color?: string;
}

export default function ProgressBar({
  label,
  current,
  goal,
  unit,
  color = colors.orange,
}: Props) {
  const progress = Math.min(current / goal, 1);
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>
          {current}
          <Text style={styles.goal}>
            /{goal} {unit}
          </Text>
        </Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[color, `${color}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: colors.textSecondary, fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' },
  goal: { fontWeight: '400', color: colors.textSecondary },
  track: {
    height: 7,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});

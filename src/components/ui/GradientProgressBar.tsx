import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '../../theme';

interface Props {
  /** 0..1 */
  progress: number;
  height?: number;
  gradientColors?: readonly [string, string];
  style?: ViewStyle;
}

export default function GradientProgressBar({
  progress,
  height = 8,
  gradientColors = gradients.primary,
  style,
}: Props) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${pct}%`, borderRadius: height / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { height: '100%' },
});

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, gradients, glow } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  strokeWidth?: number;
  /** 0..n — values > 1 trigger the over-budget overflow arc */
  progress: number;
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientColors?: readonly [string, string];
}

export default function GlowRing({
  size = 200,
  strokeWidth = 14,
  progress,
  children,
  style,
  gradientColors = gradients.ring,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const isOver = progress > 1;

  // Main arc clamped to full; overflow arc = how far past 100%
  const clampedMain = Math.min(Math.max(progress, 0), 1);
  const overflowFraction = Math.min(Math.max(progress - 1, 0), 1);

  const animatedMain = useSharedValue(0);
  const animatedOverflow = useSharedValue(0);

  useEffect(() => {
    animatedMain.value = withTiming(clampedMain, { duration: 900, easing: Easing.out(Easing.cubic) });
    animatedOverflow.value = withTiming(overflowFraction, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clampedMain, overflowFraction]);

  const mainProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedMain.value),
  }));

  const overflowAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedOverflow.value),
  }));

  // Flip to danger palette when over budget
  const activeGradient = isOver ? gradients.danger : gradientColors;
  const ringGlow: ViewStyle = isOver
    ? { shadowColor: colors.red, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 24, elevation: 8 }
    : glow;

  return (
    <View style={[{ width: size, height: size }, ringGlow, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeGradient[0]} />
            <Stop offset="100%" stopColor={activeGradient[1]} />
          </LinearGradient>
          <LinearGradient id="overGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF4444" />
            <Stop offset="100%" stopColor="#CC2222" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={isOver ? colors.redBg : colors.surfaceHigh}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Main arc (fills to 100%, turns red when over) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={mainProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Overflow arc — wraps from top, visible only when over budget */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#overGrad)"
          strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={overflowAnimProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

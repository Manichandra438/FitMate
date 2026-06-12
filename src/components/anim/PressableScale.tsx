import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { tap } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale when pressed. Default 0.96. */
  pressedScale?: number;
  /** Fire a light haptic tap on press-in. Default true. */
  haptic?: boolean;
}

export default function PressableScale({
  children,
  style,
  pressedScale = 0.96,
  haptic = true,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, { damping: 18, stiffness: 320 });
        if (haptic) tap();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

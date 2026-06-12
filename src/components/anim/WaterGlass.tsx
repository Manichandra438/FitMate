import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme';
import PressableScale from './PressableScale';

interface Props {
  filled: boolean;
  onPress: () => void;
  size?: number;
}

/** A tappable glass that fills with a springy water level + droplet pop. */
export default function WaterGlass({ filled, onPress, size = 34 }: Props) {
  const fill = useSharedValue(filled ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    fill.value = withSpring(filled ? 1 : 0, { damping: 13, stiffness: 160 });
    if (filled) {
      pop.value = withSequence(
        withTiming(1.25, { duration: 120 }),
        withSpring(1, { damping: 8, stiffness: 220 })
      );
    }
  }, [filled, fill, pop]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <PressableScale onPress={onPress} pressedScale={0.88} style={styles.wrap}>
      <Animated.View style={popStyle}>
        <View
          style={[
            styles.glass,
            { width: size, height: size * 1.2 },
            filled && styles.glassFilled,
          ]}
        >
          <Animated.View style={[styles.water, fillStyle]} />
          {filled && <Text style={styles.drop}>💧</Text>}
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 2 },
  glass: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  glassFilled: {
    borderColor: colors.sky,
  },
  water: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.skySoft,
  },
  drop: { fontSize: 14, marginBottom: 6 },
});

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../theme';

const ITEM_H = 58;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * 2; // top+bottom padding so first/last item can center

interface DrumPickerProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  unit?: string;
  width?: number;
}

function DrumItem({
  label,
  dist,
}: {
  label: string;
  dist: number;
}) {
  const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : 0.18;
  const fontSize = dist === 0 ? 38 : dist === 1 ? 26 : 20;
  const fontWeight: '800' | '600' | '400' = dist === 0 ? '800' : dist === 1 ? '600' : '400';
  const color = dist === 0 ? colors.textPrimary : colors.textSecondary;
  return (
    <View style={styles.item}>
      <Text style={{ fontSize, fontWeight, color, opacity }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function DrumPicker({
  values,
  selectedIndex,
  onChange,
  unit,
  width = 140,
}: DrumPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastFiredIndex = useRef(selectedIndex);
  const isScrolling = useRef(false);

  // Scroll to initial index on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync if parent changes selectedIndex (e.g. unit toggle resets)
  useEffect(() => {
    if (!isScrolling.current && selectedIndex !== lastFiredIndex.current) {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
      lastFiredIndex.current = selectedIndex;
    }
  }, [selectedIndex]);

  const settle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      const offsetY = e.nativeEvent.contentOffset.y;
      const newIndex = Math.round(offsetY / ITEM_H);
      const clamped = Math.max(0, Math.min(newIndex, values.length - 1));
      if (clamped !== lastFiredIndex.current) {
        lastFiredIndex.current = clamped;
        onChange(clamped);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }
    },
    [values.length, onChange],
  );

  return (
    <View
      style={[styles.outer, { width }]}
      accessibilityRole="adjustable"
      accessibilityLabel={unit ? `${unit} picker` : 'Value picker'}
      accessibilityValue={{ text: values[selectedIndex] }}
    >
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
      <View style={styles.highlight} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        onScrollBeginDrag={() => { isScrolling.current = true; }}
        style={{ height: PICKER_H }}
        scrollEventThrottle={16}
      >
        {values.map((v, index) => (
          <DrumItem key={index} label={v} dist={Math.abs(index - selectedIndex)} />
        ))}
      </ScrollView>

      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    position: 'relative',
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD - ITEM_H / 2 + ITEM_H,
    height: ITEM_H,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    zIndex: 0,
  },
  fadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: PAD,
    zIndex: 1,
    backgroundColor: 'transparent',
    // Android doesn't support gradient via RN core — use opacity via items instead
    pointerEvents: 'none',
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PAD,
    zIndex: 1,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

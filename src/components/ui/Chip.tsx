import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export default function Chip({ label, selected = false, onPress, color = colors.primary, style }: Props) {
  const inner = (
    <View
      style={[
        styles.chip,
        selected && { backgroundColor: `${color}26`, borderColor: color },
        style,
      ]}
    >
      <Text style={[styles.text, selected && { color }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});

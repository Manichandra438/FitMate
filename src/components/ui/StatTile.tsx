import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface Props {
  icon: React.ReactNode;
  value: string;
  label: string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function StatTile({ icon, value, label, accentColor = colors.primary, onPress, style }: Props) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}1A` }]}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.tile, style]} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.tile, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
});

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, cardShadow } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Renders a thin gradient border around the card. */
  accent?: boolean;
  /** Fills the card body with the subtle card gradient instead of flat surface. */
  gradient?: boolean;
}

export default function GradientCard({ children, style, accent = false, gradient = true }: Props) {
  const body = gradient ? (
    <LinearGradient
      colors={gradients.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.inner, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.inner, { backgroundColor: colors.surface }, style]}>{children}</View>
  );

  if (accent) {
    return <View style={[styles.accentBorder, cardShadow]}>{body}</View>;
  }

  return <View style={[styles.plainBorder, cardShadow]}>{body}</View>;
}

const styles = StyleSheet.create({
  plainBorder: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBorder: {
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  inner: {
    borderRadius: radius.card - 1.5,
    padding: spacing.lg,
  },
});

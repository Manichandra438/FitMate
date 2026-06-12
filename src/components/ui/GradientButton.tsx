import React from 'react';
import { StyleSheet, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, glowSubtle } from '../../theme';
import PressableScale from '../anim/PressableScale';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  icon,
}: Props) {
  if (variant === 'ghost') {
    return (
      <PressableScale
        style={[styles.ghost, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {icon}
        <Text style={styles.ghostText}>{title}</Text>
      </PressableScale>
    );
  }

  const grad = variant === 'danger' ? gradients.danger : gradients.primary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[!disabled && variant === 'primary' && glowSubtle, style]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
  },
  text: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.45 },
});

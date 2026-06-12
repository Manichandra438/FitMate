import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

interface OptionCardProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ title, subtitle, emoji, selected, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {emoji ? <Text style={styles.optionEmoji}>{emoji}</Text> : null}
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, selected && { color: colors.primaryDark }]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
    </TouchableOpacity>
  );
}

interface NumberFieldProps {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NumberField({ value, onChange, unit, placeholder, autoFocus }: NumberFieldProps) {
  return (
    <View style={styles.numberWrap}>
      <TextInput
        style={styles.numberInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        maxLength={6}
      />
      <Text style={styles.numberUnit}>{unit}</Text>
    </View>
  );
}

interface SegmentProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segment<T extends string | number>({ options, value, onChange }: SegmentProps<T>) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionEmoji: { fontSize: 26 },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  optionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  numberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 130,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },
  numberUnit: { fontSize: 20, fontWeight: '600', color: colors.textSecondary },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentItemSelected: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  segmentTextSelected: { color: '#fff' },
});

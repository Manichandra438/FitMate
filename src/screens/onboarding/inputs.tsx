import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import DrumPicker from '../../components/ui/DrumPicker';

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
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  value,
  onChange,
  unit,
  min = 0,
  max = 300,
  step = 1,
}: NumberFieldProps) {
  const values = useMemo(() => {
    const arr: string[] = [];
    const decimals = step < 1 ? 1 : 0;
    for (let v = min; v <= max; v = Math.round((v + step) * 1e6) / 1e6) {
      arr.push(v.toFixed(decimals));
    }
    return arr;
  }, [min, max, step]);

  const selectedIndex = useMemo(() => {
    const idx = values.indexOf(
      parseFloat(value).toFixed(step < 1 ? 1 : 0),
    );
    return idx >= 0 ? idx : Math.floor(values.length / 2);
  }, [values, value, step]);

  return (
    <View style={styles.numberWrap}>
      <DrumPicker
        values={values}
        selectedIndex={selectedIndex}
        onChange={(i) => onChange(values[i])}
        unit={unit}
        width={160}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
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

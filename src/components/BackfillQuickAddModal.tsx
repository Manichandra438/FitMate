import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { success } from '../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  onAdded?: () => void;
}

export default function BackfillQuickAddModal({ visible, onClose, defaultDate, onAdded }: Props) {
  const { quickAdd } = useFitStore();

  const dateOptions = [
    { label: 'Today', value: dayjs().format('YYYY-MM-DD') },
    { label: 'Yesterday', value: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
    { label: dayjs().subtract(2, 'day').format('ddd'), value: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
  ];

  const [selectedDate, setSelectedDate] = useState(defaultDate ?? dateOptions[0].value);
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedDate(defaultDate ?? dateOptions[0].value);
      setKcal('');
      setProtein('');
      setCarbs('');
      setFat('');
      setLabel('');
    }
  }, [visible, defaultDate]);

  const handleAdd = () => {
    const k = parseFloat(kcal);
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || undefined;
    const f = parseFloat(fat) || undefined;
    if (isNaN(k) || k <= 0) {
      Alert.alert('Invalid', 'Enter valid calories.');
      return;
    }
    quickAdd(k, p, label || undefined, selectedDate, c, f);
    success();
    onAdded?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quick Add</Text>
          <Text style={styles.sub}>Add restaurant/snack calories without searching</Text>

          <View style={styles.dateRow}>
            {dateOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.dateChip, selectedDate === opt.value && styles.dateChipActive]}
                onPress={() => setSelectedDate(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateChipText, selectedDate === opt.value && styles.dateChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Pizza at restaurant"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.macroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                value={kcal}
                onChangeText={setKcal}
                keyboardType="numeric"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={[styles.macroRow, { marginTop: spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Carbs (g) <Text style={styles.optionalHint}>optional</Text></Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Fat (g) <Text style={styles.optionalHint}>optional</Text></Text>
              <TextInput
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add calories</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },

  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  dateChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  dateChipTextActive: { color: colors.primaryDark },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  macroRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  optionalHint: { fontSize: 10, color: colors.textMuted, fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
});

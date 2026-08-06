import React, { useState } from 'react';
import { appAlert } from '../components/AppAlert';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { useFitStore } from '../store/useFitStore';
import { NutritionixFood } from '../types';

type RouteParams = {
  CustomFood: { onCreated?: (food: NutritionixFood) => void };
};

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        keyboardType={hint === 'text' ? 'default' : 'numeric'}
        selectTextOnFocus
        placeholderTextColor={colors.textMuted}
        placeholder={hint === 'text' ? 'e.g. Mom\'s Dal' : '0'}
      />
    </View>
  );
}

export default function CustomFoodScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CustomFood'>>();
  const { addCustomFood } = useFitStore();

  const [name, setName] = useState('');
  const [kcalPer100, setKcalPer100] = useState('');
  const [proteinPer100, setProteinPer100] = useState('');
  const [carbsPer100, setCarbsPer100] = useState('');
  const [fatPer100, setFatPer100] = useState('');
  const [defaultGrams, setDefaultGrams] = useState('100');

  const handleSave = () => {
    const n = name.trim();
    const k = parseFloat(kcalPer100);
    const p = parseFloat(proteinPer100) || 0;
    const c = parseFloat(carbsPer100) || 0;
    const f = parseFloat(fatPer100) || 0;
    const g = parseFloat(defaultGrams) || 100;

    if (!n) { appAlert('Missing name', 'Enter a food name.'); return; }
    if (isNaN(k) || k <= 0) { appAlert('Invalid', 'Enter valid kcal per 100g.'); return; }

    addCustomFood({
      name: n,
      grams: g,
      kcalPer100g: k,
      proteinPer100g: p,
      carbsPer100g: c,
      fatPer100g: f,
      kcal: Math.round((k * g) / 100),
      protein: Math.round(((p * g) / 100) * 10) / 10,
    });

    if (route.params?.onCreated) {
      route.params.onCreated({
        food_name: n,
        nf_calories: Math.round(k),
        nf_protein: p,
        nf_total_carbohydrate: c,
        nf_total_fat: f,
        serving_weight_grams: g,
      });
    }

    appAlert('Saved!', `"${n}" added to your custom foods.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconRow}>
          <View style={styles.iconBox}>
            <Ionicons name="restaurant" size={32} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>Enter nutrition info per 100g</Text>
        </View>

        <Field label="Food name *" value={name} onChange={setName} hint="text" />
        <Field label="Calories (kcal per 100g) *" value={kcalPer100} onChange={setKcalPer100} />
        <Field label="Protein (g per 100g)" value={proteinPer100} onChange={setProteinPer100} />
        <Field label="Carbohydrates (g per 100g)" value={carbsPer100} onChange={setCarbsPer100} />
        <Field label="Fat (g per 100g)" value={fatPer100} onChange={setFatPer100} />
        <Field label="Default serving size (g)" value={defaultGrams} onChange={setDefaultGrams} />

        {name && kcalPer100 && !isNaN(parseFloat(kcalPer100)) && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Preview — {parseFloat(defaultGrams) || 100}g serving</Text>
            <Text style={styles.previewVal}>
              {Math.round((parseFloat(kcalPer100) * (parseFloat(defaultGrams) || 100)) / 100)} kcal
              {proteinPer100 ? ` · ${Math.round(((parseFloat(proteinPer100) * (parseFloat(defaultGrams) || 100)) / 100) * 10) / 10}g protein` : ''}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>Save food</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  iconRow: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: 14, color: colors.textPrimary, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: colors.border },
  preview: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.primary },
  previewTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  previewVal: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

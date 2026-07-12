import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, Meal, MealSlotType, MealTemplate } from '../types';
import { colors } from '../theme';
import { MEAL_TEMPLATES } from '../data/mealTemplates';
import { matchesCuisine, swapMealTemplate } from '../services/planGenerator';
import { useFitStore } from '../store/useFitStore';
import MealCard from '../components/MealCard';
import BackfillQuickAddModal from '../components/BackfillQuickAddModal';
import ConfettiBurst, { ConfettiBurstHandle } from '../components/anim/ConfettiBurst';
import { success } from '../utils/haptics';

export default function MealsScreen() {
  const navigation = useNavigation<any>();
  const { mealPlan, logMeal, addFoodToMeal, removeFoodFromMeal, skipMeal, unlogMeal, updateSingleMeal, profile, getTodayLog, ensureTodayLog, getTodayTotals, copyYesterdayMeals, removeQuickAdd } =
    useFitStore();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editKcal, setEditKcal] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [swapVisible, setSwapVisible] = useState(false);
  const [swapOptions, setSwapOptions] = useState<MealTemplate[]>([]);
  const [quickModalVisible, setQuickModalVisible] = useState(false);
  const confetti = useRef<ConfettiBurstHandle>(null);

  useFocusEffect(useCallback(() => { ensureTodayLog(); }, []));

  const log = getTodayLog();
  const { kcal, protein } = getTodayTotals();

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMeal(null);
    setEditMode(false);
  };

  const inferSlot = (mealName: string): MealSlotType => {
    const lower = mealName.toLowerCase();
    if (lower.includes('breakfast')) return 'breakfast';
    if (lower.includes('lunch')) return 'lunch';
    if (lower.includes('dinner')) return 'dinner';
    return 'snack';
  };

  const handleSwapOpen = () => {
    if (!selectedMeal) return;
    const slot = inferSlot(selectedMeal.name);
    const options = MEAL_TEMPLATES.filter(
      (t) => t.slot === slot && t.dietPref.includes(profile.dietPref) &&
        matchesCuisine(t, profile.cuisineRegion) && t.name !== selectedMeal.name
    );
    setSwapOptions(options);
    setModalVisible(false);
    setSwapVisible(true);
  };

  const handleSwapPick = (template: MealTemplate) => {
    if (!selectedMeal) return;
    const swapped = swapMealTemplate(selectedMeal, template);
    updateSingleMeal(selectedMeal.id, swapped);
    setSwapVisible(false);
    setSelectedMeal(null);
  };

  const handleMealPress = (meal: Meal) => {
    const mealLog = log.meals.find((m) => m.mealId === meal.id);
    setSelectedMeal(meal);
    if (mealLog?.logged) {
      setEditKcal(String(mealLog.totalKcal));
      setEditProtein(String(Math.round(mealLog.totalProtein)));
      setEditMode(true);
    } else {
      setEditMode(false);
    }
    setModalVisible(true);
  };

  const handleLog = () => {
    if (!selectedMeal) return;
    logMeal(selectedMeal.id, selectedMeal.totalKcal, selectedMeal.totalProtein, selectedMeal.foods);
    closeModal();
    success();
    confetti.current?.burst();
  };

  const handleAddFood = () => {
    if (!selectedMeal) return;
    closeModal();
    navigation.navigate('FoodSearch', {
      mealId: selectedMeal.id,
      mealName: selectedMeal.name,
      mode: 'add',
    });
  };

  const handleSaveEdit = () => {
    if (!selectedMeal) return;
    const k = parseFloat(editKcal);
    const p = parseFloat(editProtein);
    if (isNaN(k) || isNaN(p) || k < 0 || p < 0) {
      Alert.alert('Invalid values', 'Enter valid numbers for kcal and protein.');
      return;
    }
    logMeal(selectedMeal.id, Math.round(k), Math.round(p * 10) / 10);
    closeModal();
    success();
    confetti.current?.burst();
  };

  const handleSkip = () => {
    if (!selectedMeal) return;
    skipMeal(selectedMeal.id);
    closeModal();
  };

  const handleUnlog = () => {
    if (!selectedMeal) return;
    unlogMeal(selectedMeal.id);
    closeModal();
  };

  const handleFoodSearch = () => {
    if (!selectedMeal) return;
    closeModal();
    navigation.navigate('FoodSearch', {
      mealId: selectedMeal.id,
      mealName: selectedMeal.name,
    });
  };

  const mealsLogged = log.meals.filter((m) => m.logged).length;
  const mealsSkipped = log.meals.filter((m) => m.skipped).length;

  const handleCopyYesterday = () => {
    const ok = copyYesterdayMeals();
    if (!ok) Alert.alert('Nothing to copy', "Yesterday's log has no logged meals.");
    else { success(); confetti.current?.burst(); }
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Meals</Text>
        <Text style={styles.subtitle}>
          {mealsLogged}/{mealPlan.length} logged
          {mealsSkipped > 0 ? ` · ${mealsSkipped} skipped` : ''}
        </Text>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.green }]}>
            {kcal}
          </Text>
          <Text style={styles.summaryLabel}>kcal eaten</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.orange }]}>
            {protein}g
          </Text>
          <Text style={styles.summaryLabel}>protein</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{mealsLogged}</Text>
          <Text style={styles.summaryLabel}>meals done</Text>
        </View>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCopyYesterday} activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={styles.actionBtnText}>Copy yesterday</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAlt]} onPress={() => setQuickModalVisible(true)} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={16} color={colors.mint} />
          <Text style={[styles.actionBtnText, { color: colors.mint }]}>Quick add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {mealPlan.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            log={log.meals.find((m) => m.mealId === meal.id)}
            onPress={() => handleMealPress(meal)}
          />
        ))}

        {/* Quick adds */}
        {(log.quickAdds ?? []).length > 0 && (
          <View style={styles.qaSection}>
            <Text style={styles.qaTitle}>⚡ Quick adds</Text>
            {(log.quickAdds ?? []).map((qa) => (
              <View key={qa.id} style={styles.qaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qaLabel}>{qa.label || 'Quick add'}</Text>
                  <Text style={styles.qaMacros}>{qa.kcal} kcal · {qa.protein}g protein · {qa.addedAt}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeQuickAdd(qa.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${qa.label || 'quick add'}`}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <ConfettiBurst ref={confetti} />

      <BackfillQuickAddModal
        visible={quickModalVisible}
        onClose={() => setQuickModalVisible(false)}
        onAdded={() => confetti.current?.burst()}
      />

      {/* Swap Meal Modal */}
      <Modal
        visible={swapVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSwapVisible(false)}
        >
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Swap meal</Text>
            <Text style={styles.modalTime}>Choose a replacement for the same slot</Text>
            {swapOptions.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginVertical: 20 }}>
                No other options available for your diet preference.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {swapOptions.map((template) => {
                  const previewFoods = template.foods.map((f) => f.name).slice(0, 3).join(', ');
                  return (
                    <TouchableOpacity
                      key={template.name}
                      style={styles.swapOption}
                      onPress={() => handleSwapPick(template)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.swapOptionName}>{template.name}</Text>
                        <Text style={styles.swapOptionFoods} numberOfLines={1}>{previewFoods}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Meal Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
            {selectedMeal && (
              <>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                  {editMode && (
                    <View style={styles.editBadge}>
                      <Text style={styles.editBadgeText}>Logged</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalTime}>
                  {(() => {
                    const [h, m] = selectedMeal.time.split(':').map(Number);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
                  })()}
                </Text>

                {editMode ? (
                  /* ── EDIT MODE ── */
                  <>
                    <Text style={styles.editHint}>Adjust logged values:</Text>
                    <View style={styles.editRow}>
                      <View style={styles.editField}>
                        <Text style={styles.editLabel}>Calories (kcal)</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editKcal}
                          onChangeText={setEditKcal}
                          keyboardType="numeric"
                          selectTextOnFocus
                          placeholderTextColor={COLORS.textSecondary}
                        />
                      </View>
                      <View style={styles.editField}>
                        <Text style={styles.editLabel}>Protein (g)</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editProtein}
                          onChangeText={setEditProtein}
                          keyboardType="numeric"
                          selectTextOnFocus
                          placeholderTextColor={COLORS.textSecondary}
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveEdit}>
                      <Ionicons name="save-outline" size={20} color="#fff" />
                      <Text style={styles.btnPrimaryText}>Save changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnSecondary} onPress={handleAddFood}>
                      <Ionicons name="add-circle-outline" size={18} color={colors.primaryDark} />
                      <Text style={styles.btnSecondaryText}>Add food</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnSecondary} onPress={handleFoodSearch}>
                      <Ionicons name="search" size={18} color={colors.primaryDark} />
                      <Text style={styles.btnSecondaryText}>Search / replace food</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnDanger} onPress={handleUnlog}>
                      <Text style={styles.btnDangerText}>Undo log</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ── LOG MODE ── */
                  <>
                    {(() => {
                      const mealLog = log.meals.find((m) => m.mealId === selectedMeal.id);
                      const displayFoods = mealLog?.foods?.length ? mealLog.foods : selectedMeal.foods;
                      const displayKcal = mealLog?.logged ? mealLog.totalKcal : selectedMeal.totalKcal;
                      const displayProtein = mealLog?.logged ? mealLog.totalProtein : selectedMeal.totalProtein;
                      const isLogged = mealLog?.logged ?? false;
                      return (
                        <>
                          <View style={styles.foodsList}>
                            {displayFoods.map((food) => (
                              <View key={food.id} style={styles.foodRow}>
                                <Text style={styles.foodName}>{food.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.foodMacros}>
                                    {food.grams}g · {food.kcal} kcal
                                  </Text>
                                  {isLogged && (
                                    <TouchableOpacity
                                      onPress={() => removeFoodFromMeal(selectedMeal.id, food.id)}
                                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Remove ${food.name}`}
                                    >
                                      <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>

                          <View style={styles.mealTotals}>
                            <Text style={styles.mealTotal}>
                              Total:{' '}
                              <Text style={{ color: COLORS.green }}>{displayKcal} kcal</Text>
                              {' · '}
                              <Text style={{ color: COLORS.orange }}>{Math.round(displayProtein)}g protein</Text>
                            </Text>
                          </View>

                          {!isLogged && (
                            <TouchableOpacity style={styles.btnPrimary} onPress={handleLog}>
                              <Ionicons name="checkmark-circle" size={20} color="#fff" />
                              <Text style={styles.btnPrimaryText}>Log this meal as planned</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity style={styles.btnSecondary} onPress={handleAddFood}>
                            <Ionicons name="add-circle-outline" size={18} color={colors.primaryDark} />
                            <Text style={styles.btnSecondaryText}>Add food</Text>
                          </TouchableOpacity>

                          {!isLogged && (
                            <TouchableOpacity style={styles.btnSecondary} onPress={handleSwapOpen}>
                              <Ionicons name="shuffle" size={18} color={colors.primaryDark} />
                              <Text style={styles.btnSecondaryText}>Swap meal</Text>
                            </TouchableOpacity>
                          )}

                          {!isLogged && (
                            <TouchableOpacity style={styles.btnDanger} onPress={handleSkip}>
                              <Text style={styles.btnDangerText}>Skip this meal</Text>
                            </TouchableOpacity>
                          )}

                          {isLogged && (
                            <TouchableOpacity style={styles.btnDanger} onPress={handleUnlog}>
                              <Text style={styles.btnDangerText}>Undo log</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primarySoft, borderRadius: 999, paddingVertical: 9, borderWidth: 1, borderColor: colors.primary },
  actionBtnAlt: { backgroundColor: colors.mintSoft, borderColor: colors.mint },
  actionBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  qaSection: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  qaTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  qaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qaLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  qaMacros: { fontSize: 12, color: COLORS.textSecondary },
  scroll: { paddingHorizontal: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46,42,38,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  editBadge: {
    backgroundColor: COLORS.greenBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.greenDark,
  },
  editBadgeText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '600',
  },
  editHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    marginTop: 4,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editField: {
    flex: 1,
  },
  editLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  modalTime: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  foodsList: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  foodMacros: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  mealTotals: {
    marginBottom: 16,
  },
  mealTotal: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnSecondaryText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDanger: {
    padding: 14,
    alignItems: 'center',
  },
  btnDangerText: {
    color: COLORS.red,
    fontSize: 14,
  },
  swapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  swapOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  swapOptionFoods: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

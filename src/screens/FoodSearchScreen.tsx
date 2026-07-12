import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FoodItem, NutritionixFood } from '../types';
import { searchFoods, getNutrients } from '../services/nutritionix';
import { useFitStore } from '../store/useFitStore';
import { success } from '../utils/haptics';
import { colors } from '../theme';

type RouteParams = {
  FoodSearch: { mealId: string; mealName: string; mode?: 'add' | 'replace' };
};

export default function FoodSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'FoodSearch'>>();
  const { mealId, mealName, mode = 'replace' } = route.params;
  const { logMeal, addFoodToMeal, profile, toggleFavourite, customFoods } = useFitStore();
  const favourites = profile.favouriteFoods ?? [];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NutritionixFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NutritionixFood | null>(null);
  const [grams, setGrams] = useState('100');
  const [gramModalVisible, setGramModalVisible] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const foods = await searchFoods(text);
      setResults(foods);
      setLoading(false);
    }, 500);
  };

  const handleSelect = (food: NutritionixFood) => {
    setSelected(food);
    setGrams(String(food.serving_weight_grams || 100));
    setGramModalVisible(true);
  };

  const handleConfirm = () => {
    if (!selected) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) {
      Alert.alert('Invalid grams', 'Enter a valid gram amount.');
      return;
    }
    const { kcal, protein } = getNutrients(selected, g);
    const swg = selected.serving_weight_grams > 0 ? selected.serving_weight_grams : 100;
    const kcalPer100g = Math.round((selected.nf_calories / swg) * 100);
    const proteinPer100g = Math.round(((selected.nf_protein / swg) * 100) * 10) / 10;

    if (mode === 'add') {
      const foodItem: FoodItem = {
        id: `fs_${Date.now()}`,
        name: selected.food_name,
        grams: g,
        kcalPer100g,
        proteinPer100g,
        carbsPer100g: selected.nf_total_carbohydrate != null
          ? Math.round((selected.nf_total_carbohydrate / swg) * 100)
          : undefined,
        fatPer100g: selected.nf_total_fat != null
          ? Math.round(((selected.nf_total_fat / swg) * 100) * 10) / 10
          : undefined,
        kcal,
        protein,
      };
      addFoodToMeal(mealId, foodItem);
      success();
      setGramModalVisible(false);
      setSelected(null);
      setQuery('');
      setResults([]);
      Alert.alert(
        'Added!',
        `${selected.food_name.charAt(0).toUpperCase() + selected.food_name.slice(1)} added to meal.`,
        [
          { text: 'Add more', style: 'cancel' },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      logMeal(mealId, kcal, protein);
      success();
      setGramModalVisible(false);
      navigation.goBack();
    }
  };

  const handleBarcodeFound = (food: NutritionixFood) => {
    handleSelect(food);
  };

  const filteredCustomFoods = customFoods.filter((f) =>
    query.length === 0 || f.name.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }: { item: NutritionixFood }) => {
    const isFav = favourites.includes(item.food_name);
    return (
      <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
        <View style={styles.resultLeft}>
          <Text style={styles.resultName}>
            {item.food_name.charAt(0).toUpperCase() + item.food_name.slice(1)}
          </Text>
          <Text style={styles.resultMeta}>
            {item.serving_weight_grams}g · ~{Math.round(item.nf_calories)} kcal ·{' '}
            ~{Math.round(item.nf_protein)}g protein
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavourite(item.food_name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginRight: 8 }}
        >
          <Ionicons name={isFav ? 'star' : 'star-outline'} size={20} color={isFav ? '#FFC145' : COLORS.textSecondary} />
        </TouchableOpacity>
        <Ionicons name="add-circle-outline" size={22} color={COLORS.green} />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Search food (e.g. dal, chicken, roti)"
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(''); setResults([]); }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('BarcodeScanner', { onFound: handleBarcodeFound })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.barcodeBtn}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
        >
          <Ionicons name="barcode-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('CustomFood', { onCreated: handleBarcodeFound })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Add custom food"
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Custom foods */}
      {filteredCustomFoods.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>🍳 My Foods</Text>
          <View style={styles.chips}>
            {filteredCustomFoods.map((f) => (
              <TouchableOpacity key={f.id} style={[styles.chip, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                onPress={() => handleSelect({ food_name: f.name, nf_calories: Math.round(f.kcalPer100g), nf_protein: f.proteinPer100g, nf_total_carbohydrate: f.carbsPer100g, nf_total_fat: f.fatPer100g, serving_weight_grams: 100 })}>
                <Text style={[styles.chipText, { color: colors.primaryDark }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Favourites */}
      {query.length === 0 && favourites.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>⭐ Favourites</Text>
          <View style={styles.chips}>
            {favourites.map((name) => (
              <TouchableOpacity key={name} style={[styles.chip, styles.chipFav]} onPress={() => handleSearch(name)}>
                <Text style={styles.chipText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Quick suggestions */}
      {query.length === 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Common searches</Text>
          <View style={styles.chips}>
            {[
              'dal', 'roti', 'rice', 'chicken', 'egg', 'banana',
              'paneer', 'sabzi', 'chana', 'dosa',
            ].map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.chip}
                onPress={() => handleSearch(s)}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={styles.loadingText}>Searching foods...</Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.food_name}_${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.length >= 2 ? (
            <Text style={styles.empty}>No results for "{query}"</Text>
          ) : null
        }
      />

      {/* Gram entry modal */}
      <Modal
        visible={gramModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGramModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGramModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            {selected && (
              <>
                <Text style={styles.modalTitle}>
                  {selected.food_name.charAt(0).toUpperCase() +
                    selected.food_name.slice(1)}
                </Text>
                <Text style={styles.modalSub}>
                  Per 100g: ~
                  {selected.serving_weight_grams > 0
                    ? Math.round((selected.nf_calories / selected.serving_weight_grams) * 100)
                    : Math.round(selected.nf_calories)}{' '}
                  kcal ·{' '}
                  ~{selected.serving_weight_grams > 0
                    ? Math.round((selected.nf_protein / selected.serving_weight_grams) * 100)
                    : Math.round(selected.nf_protein)}
                  g protein
                </Text>

                <Text style={styles.gramLabel}>How many grams?</Text>
                <TextInput
                  style={styles.gramInput}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="numeric"
                  selectTextOnFocus
                  placeholder="100"
                  placeholderTextColor={COLORS.textSecondary}
                />

                {/* Preview */}
                {!isNaN(parseFloat(grams)) && parseFloat(grams) > 0 && selected.serving_weight_grams > 0 && (
                  <Text style={styles.preview}>
                    ≈{' '}
                    {Math.round(
                      (selected.nf_calories / selected.serving_weight_grams) *
                        parseFloat(grams)
                    )}{' '}
                    kcal ·{' '}
                    {Math.round(
                      (selected.nf_protein / selected.serving_weight_grams) *
                        parseFloat(grams) *
                        10
                    ) / 10}
                    g protein
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirm}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.bg}
                  />
                  <Text style={styles.confirmText}>{mode === 'add' ? 'Add to meal' : 'Log this food'}</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  barcodeBtn: { marginRight: 4 },
  suggestions: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipFav: {
    borderColor: '#FFC145',
    backgroundColor: '#FFF3D6',
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  resultLeft: { flex: 1 },
  resultName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  resultMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
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
    paddingBottom: 40,
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
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  modalSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  gramLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  gramInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    textAlign: 'center',
  },
  preview: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '700',
  },
});

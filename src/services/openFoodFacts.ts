import { NutritionixFood } from '../types';

export async function lookupBarcode(barcode: string): Promise<NutritionixFood | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    const kcalPer100g: number = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0;
    const protein: number = n['proteins_100g'] ?? 0;
    const carbs: number = n['carbohydrates_100g'] ?? 0;
    const fat: number = n['fat_100g'] ?? 0;
    const name: string = p.product_name || p.generic_name || barcode;

    if (!kcalPer100g) return null;

    return {
      food_name: name,
      nf_calories: Math.round(kcalPer100g),
      nf_protein: Math.round(protein * 10) / 10,
      nf_total_carbohydrate: Math.round(carbs * 10) / 10,
      nf_total_fat: Math.round(fat * 10) / 10,
      serving_weight_grams: 100,
      barcode,
    };
  } catch {
    return null;
  }
}

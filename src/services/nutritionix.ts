import { NutritionixFood } from '../types';

// USDA FoodData Central — free, no registration required, CORS-safe
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
// DEMO_KEY is shared across every app using it and capped at 30 req/hour, 50/day
// per IP — expect frequent rate-limiting under real use. Get a free dedicated key
// (1000 req/hour) at https://api.data.gov/signup and set EXPO_PUBLIC_USDA_API_KEY.
const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';

export class FoodSearchError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
    this.name = 'FoodSearchError';
  }
}

export async function searchFoods(query: string): Promise<NutritionixFood[]> {
  if (!query.trim()) return [];
  const url =
    `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}` +
    `&api_key=${API_KEY}&pageSize=20&dataType=SR%20Legacy,Foundation,Branded`;
  const res = await fetch(url);
  if (!res.ok) throw new FoodSearchError(res.status);
  const data = await res.json();

  const results: NutritionixFood[] = (data.foods ?? [])
    .map((item: any) => {
      const nutrients: any[] = item.foodNutrients ?? [];
      const kcalNutrient = nutrients.find((n) => n.nutrientId === 1008);
      const proteinNutrient = nutrients.find((n) => n.nutrientId === 1003);
      const carbsNutrient = nutrients.find((n) => n.nutrientId === 1005);
      const fatNutrient = nutrients.find((n) => n.nutrientId === 1004);
      const kcalPer100g: number = kcalNutrient?.value ?? 0;
      const proteinPer100g: number = proteinNutrient?.value ?? 0;
      const carbsPer100g: number = carbsNutrient?.value ?? 0;
      const fatPer100g: number = fatNutrient?.value ?? 0;

      if (kcalPer100g === 0 || kcalPer100g > 900) return null;

      const rawServing =
        item.servingSize && item.servingSizeUnit?.toLowerCase() === 'g'
          ? item.servingSize
          : 100;
      const servingG: number = Math.max(1, Math.round(rawServing));

      return {
        food_name: item.description,
        nf_calories: Math.round((kcalPer100g * servingG) / 100),
        nf_protein: Math.round(((proteinPer100g * servingG) / 100) * 10) / 10,
        nf_total_carbohydrate: Math.round(((carbsPer100g * servingG) / 100) * 10) / 10,
        nf_total_fat: Math.round(((fatPer100g * servingG) / 100) * 10) / 10,
        serving_weight_grams: servingG,
      } as NutritionixFood;
    })
    .filter(Boolean)
    .slice(0, 15);

  return results;
}

export function getNutrients(
  food: NutritionixFood,
  grams: number
): { kcal: number; protein: number; carbs: number; fat: number } {
  const swg = food.serving_weight_grams > 0 ? food.serving_weight_grams : 100;
  return {
    kcal: Math.round((food.nf_calories / swg) * grams),
    protein: Math.round(((food.nf_protein / swg) * grams) * 10) / 10,
    carbs: Math.round((((food.nf_total_carbohydrate ?? 0) / swg) * grams) * 10) / 10,
    fat: Math.round((((food.nf_total_fat ?? 0) / swg) * grams) * 10) / 10,
  };
}

export function calcMacros(
  kcalPer100g: number,
  proteinPer100g: number,
  grams: number
) {
  return {
    kcal: Math.round((kcalPer100g * grams) / 100),
    protein: Math.round(((proteinPer100g * grams) / 100) * 10) / 10,
  };
}

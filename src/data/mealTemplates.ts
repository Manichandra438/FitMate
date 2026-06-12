import { MealTemplate } from '../types';

// Template foods use per-100g macros. `scalable` items are resized by the plan
// generator to hit calorie/protein targets; fixed items keep baseGrams.
export const MEAL_TEMPLATES: MealTemplate[] = [
  // ---------- BREAKFAST ----------
  {
    name: 'Eggs & Toast',
    slot: 'breakfast',
    dietPref: ['eggetarian', 'nonveg'],
    foods: [
      { name: 'Boiled Eggs', baseGrams: 120, kcalPer100g: 155, proteinPer100g: 13, scalable: true, maxGrams: 240 },
      { name: 'Whole Wheat Toast', baseGrams: 60, kcalPer100g: 247, proteinPer100g: 9, scalable: true, maxGrams: 120 },
      { name: 'Black Coffee', baseGrams: 240, kcalPer100g: 2, proteinPer100g: 0.3, scalable: false },
    ],
  },
  {
    name: 'Veg Poha & Curd',
    slot: 'breakfast',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Poha with Veggies', baseGrams: 200, kcalPer100g: 130, proteinPer100g: 3, scalable: true, maxGrams: 350 },
      { name: 'Curd (low fat)', baseGrams: 150, kcalPer100g: 60, proteinPer100g: 4, scalable: true, maxGrams: 300 },
      { name: 'Roasted Peanuts', baseGrams: 20, kcalPer100g: 567, proteinPer100g: 26, scalable: false },
    ],
  },
  {
    name: 'Oats & Milk',
    slot: 'breakfast',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Oats', baseGrams: 60, kcalPer100g: 389, proteinPer100g: 17, scalable: true, maxGrams: 120 },
      { name: 'Milk (toned)', baseGrams: 200, kcalPer100g: 58, proteinPer100g: 3.1, scalable: true, maxGrams: 350 },
      { name: 'Banana', baseGrams: 100, kcalPer100g: 89, proteinPer100g: 1.1, scalable: false },
    ],
  },

  // ---------- SNACK ----------
  {
    name: 'Fruit & Peanut Butter',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Banana', baseGrams: 120, kcalPer100g: 89, proteinPer100g: 1.1, scalable: true, maxGrams: 200 },
      { name: 'Peanut Butter', baseGrams: 25, kcalPer100g: 588, proteinPer100g: 25, scalable: true, maxGrams: 50 },
    ],
  },
  {
    name: 'Roasted Chana & Sprouts',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Roasted Chana / Sprouts', baseGrams: 70, kcalPer100g: 378, proteinPer100g: 19, scalable: true, maxGrams: 150 },
    ],
  },
  {
    name: 'Egg & Coffee',
    slot: 'snack',
    dietPref: ['eggetarian', 'nonveg'],
    foods: [
      { name: 'Boiled Egg', baseGrams: 60, kcalPer100g: 155, proteinPer100g: 13, scalable: true, maxGrams: 180 },
      { name: 'Black Coffee', baseGrams: 240, kcalPer100g: 2, proteinPer100g: 0.3, scalable: false },
    ],
  },
  {
    name: 'Greek Yogurt Bowl',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Greek Yogurt / Hung Curd', baseGrams: 150, kcalPer100g: 90, proteinPer100g: 9, scalable: true, maxGrams: 300 },
      { name: 'Mixed Nuts', baseGrams: 15, kcalPer100g: 607, proteinPer100g: 20, scalable: false },
    ],
  },

  // ---------- LUNCH ----------
  {
    name: 'Dal, Rice & Chicken',
    slot: 'lunch',
    dietPref: ['nonveg'],
    foods: [
      { name: 'Dal (cooked)', baseGrams: 150, kcalPer100g: 116, proteinPer100g: 9, scalable: true, maxGrams: 250 },
      { name: 'Rice / Roti', baseGrams: 150, kcalPer100g: 130, proteinPer100g: 3, scalable: true, maxGrams: 300 },
      { name: 'Chicken Breast (grilled)', baseGrams: 120, kcalPer100g: 165, proteinPer100g: 31, scalable: true, maxGrams: 250 },
      { name: 'Salad', baseGrams: 100, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },
  {
    name: 'Dal, Rice & Paneer',
    slot: 'lunch',
    dietPref: ['veg', 'eggetarian'],
    foods: [
      { name: 'Dal (cooked)', baseGrams: 150, kcalPer100g: 116, proteinPer100g: 9, scalable: true, maxGrams: 250 },
      { name: 'Rice / Roti', baseGrams: 150, kcalPer100g: 130, proteinPer100g: 3, scalable: true, maxGrams: 300 },
      { name: 'Paneer (grilled)', baseGrams: 100, kcalPer100g: 265, proteinPer100g: 18, scalable: true, maxGrams: 200 },
      { name: 'Salad', baseGrams: 100, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },
  {
    name: 'Rajma Chawal Bowl',
    slot: 'lunch',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Rajma (cooked)', baseGrams: 180, kcalPer100g: 127, proteinPer100g: 8.7, scalable: true, maxGrams: 300 },
      { name: 'Rice', baseGrams: 150, kcalPer100g: 130, proteinPer100g: 3, scalable: true, maxGrams: 280 },
      { name: 'Curd', baseGrams: 100, kcalPer100g: 60, proteinPer100g: 4, scalable: true, maxGrams: 200 },
    ],
  },

  // ---------- DINNER ----------
  {
    name: 'Light Dal & Sabzi',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    foods: [
      { name: 'Dal (light)', baseGrams: 120, kcalPer100g: 116, proteinPer100g: 9, scalable: true, maxGrams: 220 },
      { name: 'Sabzi (mixed veg)', baseGrams: 150, kcalPer100g: 50, proteinPer100g: 2, scalable: true, maxGrams: 250 },
      { name: 'Roti', baseGrams: 40, kcalPer100g: 297, proteinPer100g: 8, scalable: true, maxGrams: 120 },
    ],
  },
  {
    name: 'Grilled Chicken & Veggies',
    slot: 'dinner',
    dietPref: ['nonveg'],
    foods: [
      { name: 'Chicken Breast (grilled)', baseGrams: 150, kcalPer100g: 165, proteinPer100g: 31, scalable: true, maxGrams: 280 },
      { name: 'Steamed Veggies', baseGrams: 150, kcalPer100g: 45, proteinPer100g: 2.5, scalable: true, maxGrams: 250 },
      { name: 'Roti', baseGrams: 40, kcalPer100g: 297, proteinPer100g: 8, scalable: true, maxGrams: 80 },
    ],
  },
  {
    name: 'Paneer Bhurji & Roti',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian'],
    foods: [
      { name: 'Paneer Bhurji', baseGrams: 120, kcalPer100g: 210, proteinPer100g: 15, scalable: true, maxGrams: 220 },
      { name: 'Roti', baseGrams: 80, kcalPer100g: 297, proteinPer100g: 8, scalable: true, maxGrams: 140 },
      { name: 'Salad', baseGrams: 100, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },
];

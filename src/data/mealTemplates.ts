import { MealTemplate } from '../types';

// Template foods use per-100g macros. `scalable` items are resized by the plan
// generator to hit calorie/protein targets; fixed items keep baseGrams.
export const MEAL_TEMPLATES: MealTemplate[] = [
  // ---------- BREAKFAST (North Indian / Pan-Indian) ----------
  {
    name: 'Eggs & Toast',
    slot: 'breakfast',
    dietPref: ['eggetarian', 'nonveg'],
    cuisineRegion: ['pan-indian'],
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
    cuisineRegion: ['north-indian', 'pan-indian'],
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
    cuisineRegion: ['pan-indian'],
    foods: [
      { name: 'Oats', baseGrams: 60, kcalPer100g: 389, proteinPer100g: 17, scalable: true, maxGrams: 120 },
      { name: 'Milk (toned)', baseGrams: 200, kcalPer100g: 58, proteinPer100g: 3.1, scalable: true, maxGrams: 350 },
      { name: 'Banana', baseGrams: 100, kcalPer100g: 89, proteinPer100g: 1.1, scalable: false },
    ],
  },

  // ---------- BREAKFAST (South Indian) ----------
  {
    name: 'Idli & Sambar',
    slot: 'breakfast',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Idli (steamed)', baseGrams: 240, kcalPer100g: 58, proteinPer100g: 2, scalable: true, maxGrams: 360 },
      { name: 'Sambar', baseGrams: 200, kcalPer100g: 45, proteinPer100g: 2.5, scalable: true, maxGrams: 350 },
      { name: 'Coconut Chutney', baseGrams: 50, kcalPer100g: 280, proteinPer100g: 3, scalable: false },
    ],
  },
  {
    name: 'Dosa & Chutney',
    slot: 'breakfast',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Plain Dosa', baseGrams: 120, kcalPer100g: 133, proteinPer100g: 4, scalable: true, maxGrams: 240 },
      { name: 'Sambar', baseGrams: 150, kcalPer100g: 45, proteinPer100g: 2.5, scalable: true, maxGrams: 300 },
      { name: 'Coconut Chutney', baseGrams: 60, kcalPer100g: 280, proteinPer100g: 3, scalable: false },
      { name: 'Tomato Chutney', baseGrams: 40, kcalPer100g: 60, proteinPer100g: 1.5, scalable: false },
    ],
  },
  {
    name: 'Upma & Coconut Chutney',
    slot: 'breakfast',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Upma (semolina)', baseGrams: 200, kcalPer100g: 120, proteinPer100g: 3.5, scalable: true, maxGrams: 350 },
      { name: 'Coconut Chutney', baseGrams: 60, kcalPer100g: 280, proteinPer100g: 3, scalable: false },
      { name: 'Black Coffee', baseGrams: 240, kcalPer100g: 2, proteinPer100g: 0.3, scalable: false },
    ],
  },

  // ---------- SNACK (Pan-Indian) ----------
  {
    name: 'Fruit & Peanut Butter',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['pan-indian'],
    foods: [
      { name: 'Banana', baseGrams: 120, kcalPer100g: 89, proteinPer100g: 1.1, scalable: true, maxGrams: 200 },
      { name: 'Peanut Butter', baseGrams: 25, kcalPer100g: 588, proteinPer100g: 25, scalable: true, maxGrams: 50 },
    ],
  },
  {
    name: 'Roasted Chana & Sprouts',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['pan-indian'],
    foods: [
      { name: 'Roasted Chana / Sprouts', baseGrams: 70, kcalPer100g: 378, proteinPer100g: 19, scalable: true, maxGrams: 150 },
    ],
  },
  {
    name: 'Egg & Coffee',
    slot: 'snack',
    dietPref: ['eggetarian', 'nonveg'],
    cuisineRegion: ['pan-indian'],
    foods: [
      { name: 'Boiled Egg', baseGrams: 60, kcalPer100g: 155, proteinPer100g: 13, scalable: true, maxGrams: 180 },
      { name: 'Black Coffee', baseGrams: 240, kcalPer100g: 2, proteinPer100g: 0.3, scalable: false },
    ],
  },
  {
    name: 'Greek Yogurt Bowl',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['pan-indian'],
    foods: [
      { name: 'Greek Yogurt / Hung Curd', baseGrams: 150, kcalPer100g: 90, proteinPer100g: 9, scalable: true, maxGrams: 300 },
      { name: 'Mixed Nuts', baseGrams: 15, kcalPer100g: 607, proteinPer100g: 20, scalable: false },
    ],
  },

  // ---------- SNACK (South Indian) ----------
  {
    name: 'Murukku & Filter Coffee',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Murukku', baseGrams: 40, kcalPer100g: 468, proteinPer100g: 7, scalable: true, maxGrams: 80 },
      { name: 'Filter Coffee (with milk)', baseGrams: 150, kcalPer100g: 45, proteinPer100g: 1.5, scalable: false },
    ],
  },
  {
    name: 'Banana & Filter Coffee',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Banana', baseGrams: 120, kcalPer100g: 89, proteinPer100g: 1.1, scalable: true, maxGrams: 240 },
      { name: 'Filter Coffee (with milk)', baseGrams: 150, kcalPer100g: 45, proteinPer100g: 1.5, scalable: false },
    ],
  },
  {
    name: 'Sundal (Chickpea)',
    slot: 'snack',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Boiled Chickpea Sundal', baseGrams: 80, kcalPer100g: 165, proteinPer100g: 9, scalable: true, maxGrams: 160 },
      { name: 'Coconut (grated)', baseGrams: 15, kcalPer100g: 354, proteinPer100g: 3.3, scalable: false },
    ],
  },

  // ---------- LUNCH (North Indian / Pan-Indian) ----------
  {
    name: 'Dal, Rice & Chicken',
    slot: 'lunch',
    dietPref: ['nonveg'],
    cuisineRegion: ['north-indian', 'pan-indian'],
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
    cuisineRegion: ['north-indian', 'pan-indian'],
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
    cuisineRegion: ['north-indian'],
    foods: [
      { name: 'Rajma (cooked)', baseGrams: 180, kcalPer100g: 127, proteinPer100g: 8.7, scalable: true, maxGrams: 300 },
      { name: 'Rice', baseGrams: 150, kcalPer100g: 130, proteinPer100g: 3, scalable: true, maxGrams: 280 },
      { name: 'Curd', baseGrams: 100, kcalPer100g: 60, proteinPer100g: 4, scalable: true, maxGrams: 200 },
    ],
  },

  // ---------- LUNCH (South Indian) ----------
  {
    name: 'Rice Sambar Meal',
    slot: 'lunch',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Steamed Rice', baseGrams: 200, kcalPer100g: 130, proteinPer100g: 2.7, scalable: true, maxGrams: 350 },
      { name: 'Sambar', baseGrams: 200, kcalPer100g: 45, proteinPer100g: 2.5, scalable: true, maxGrams: 350 },
      { name: 'Rasam', baseGrams: 150, kcalPer100g: 25, proteinPer100g: 1, scalable: false },
      { name: 'Poriyal (dry vegetable curry)', baseGrams: 100, kcalPer100g: 75, proteinPer100g: 2, scalable: true, maxGrams: 200 },
      { name: 'Curd (low fat)', baseGrams: 100, kcalPer100g: 60, proteinPer100g: 4, scalable: false },
      { name: 'Papad', baseGrams: 10, kcalPer100g: 380, proteinPer100g: 15, scalable: false },
    ],
  },
  {
    name: 'Curd Rice & Pickle',
    slot: 'lunch',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Curd Rice', baseGrams: 300, kcalPer100g: 95, proteinPer100g: 3.5, scalable: true, maxGrams: 450 },
      { name: 'Mango Pickle', baseGrams: 20, kcalPer100g: 150, proteinPer100g: 1, scalable: false },
      { name: 'Papad', baseGrams: 10, kcalPer100g: 380, proteinPer100g: 15, scalable: false },
    ],
  },
  {
    name: 'Rice & Chicken Curry',
    slot: 'lunch',
    dietPref: ['nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Steamed Rice', baseGrams: 200, kcalPer100g: 130, proteinPer100g: 2.7, scalable: true, maxGrams: 350 },
      { name: 'Chicken Curry (Chettinad style)', baseGrams: 150, kcalPer100g: 175, proteinPer100g: 22, scalable: true, maxGrams: 280 },
      { name: 'Rasam', baseGrams: 150, kcalPer100g: 25, proteinPer100g: 1, scalable: false },
      { name: 'Salad', baseGrams: 80, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },

  // ---------- DINNER (North Indian / Pan-Indian) ----------
  {
    name: 'Light Dal & Sabzi',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['north-indian', 'pan-indian'],
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
    cuisineRegion: ['pan-indian'],
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
    cuisineRegion: ['north-indian'],
    foods: [
      { name: 'Paneer Bhurji', baseGrams: 120, kcalPer100g: 210, proteinPer100g: 15, scalable: true, maxGrams: 220 },
      { name: 'Roti', baseGrams: 80, kcalPer100g: 297, proteinPer100g: 8, scalable: true, maxGrams: 140 },
      { name: 'Salad', baseGrams: 100, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },

  // ---------- DINNER (South Indian) ----------
  {
    name: 'Chapati & Dal Fry',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian', 'pan-indian'],
    foods: [
      { name: 'Chapati / Roti', baseGrams: 80, kcalPer100g: 297, proteinPer100g: 8, scalable: true, maxGrams: 160 },
      { name: 'Dal Fry (toor dal)', baseGrams: 150, kcalPer100g: 110, proteinPer100g: 8, scalable: true, maxGrams: 280 },
      { name: 'Salad', baseGrams: 80, kcalPer100g: 20, proteinPer100g: 1, scalable: false },
    ],
  },
  {
    name: 'Rasam Rice & Papad',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian', 'nonveg'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Steamed Rice', baseGrams: 150, kcalPer100g: 130, proteinPer100g: 2.7, scalable: true, maxGrams: 280 },
      { name: 'Rasam', baseGrams: 200, kcalPer100g: 25, proteinPer100g: 1, scalable: true, maxGrams: 350 },
      { name: 'Curd (low fat)', baseGrams: 100, kcalPer100g: 60, proteinPer100g: 4, scalable: false },
      { name: 'Papad', baseGrams: 10, kcalPer100g: 380, proteinPer100g: 15, scalable: false },
    ],
  },
  {
    name: 'Bisibele Bath',
    slot: 'dinner',
    dietPref: ['veg', 'eggetarian'],
    cuisineRegion: ['south-indian'],
    foods: [
      { name: 'Bisibele Bath', baseGrams: 300, kcalPer100g: 105, proteinPer100g: 4.5, scalable: true, maxGrams: 480 },
      { name: 'Curd (low fat)', baseGrams: 100, kcalPer100g: 60, proteinPer100g: 4, scalable: false },
      { name: 'Papad', baseGrams: 10, kcalPer100g: 380, proteinPer100g: 15, scalable: false },
    ],
  },
];

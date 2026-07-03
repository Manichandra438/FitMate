---
topic: meal-planning
created: 2026-06-20
confidence: high
status: active
---

# Domain: Meal Planning

## Overview
`planGenerator.ts` generates a `Meal[]` from user answers + computed targets. Used during onboarding and on every EditProfile save.

## Flow
```
OnboardingAnswers + PlanTargets
  → generateMealPlan(answers, targets)
    → mealTimes(count, wakeTime, sleepTime, fastingProtocol)
    → for each slot: pick template (cuisine + diet filter, fallback chain)
    → buildFoods(template, targetKcal, index)  ← scales portions
  → Meal[]
```

## IF window calculation
`computeIfWindow(protocol, wakeTime, sleepTime)` — exported, used everywhere:
- `16:8`: eatStart = wake + 1h, eatEnd = eatStart + 8h (capped at sleep - 60min)
- `18:6`: eatStart = wake + 2h, eatEnd = eatStart + 6h
- `20:4`: eatStart = wake + 4h, eatEnd = eatStart + 4h
- `none`: meals from wake+1h to sleep-90min

## Cuisine filtering
`matchesCuisine(template, region)`:
- `pan-indian` → templates with no `cuisineRegion` OR includes `'pan-indian'`
- `south-indian` → pan-indian templates PLUS templates with `'south-indian'`
- Fallback: if slot has no matching templates, falls back to pan-indian pool

## Template tags
`cuisineRegion?: CuisineRegion[]` on MealTemplate:
- No tag → only shown for pan-indian users
- `['pan-indian']` → shown for all cuisines
- `['north-indian','pan-indian']` → shown for north-indian and pan-indian
- `['south-indian']` → only south-indian users

## Template count (as of 2026-06-20)
~25 templates: 13 original + 12 South Indian (3 breakfast, 3 snack, 3 lunch, 3 dinner)

## Multi-food logging
Store actions:
- `addFoodToMeal(mealId, food)` — appends, recalculates totals from array
- `removeFoodFromMeal(mealId, foodId)` — filters, recalculates
- `logMeal(mealId, kcal, protein, foods?)` — snapshot foods into MealLog
- `unlogMeal(mealId)` — resets MealLog.foods back to planMeal.foods

FoodSearch `mode` param:
- `'add'` → calls `addFoodToMeal`, title = "Add to [meal]", after confirm shows "Done"/"Add more"
- `'replace'` (default) → calls `logMeal`, replaces meal

## MEAL_SPLITS (mealsPerDay → slot array)
- 3 meals: `['breakfast','lunch','dinner']`
- 4 meals: `['breakfast','snack','lunch','dinner']`
- 5 meals: `['breakfast','snack','lunch','snack','dinner']`
- 6 meals: `['breakfast','snack','lunch','snack','dinner','snack']`

## Cross-links
[[patterns]] [[architecture]] [[anti-patterns]]

---
project: FitMate
confidence: high
last-verified: 2026-06-20
status: active
---

# Code Patterns

## Conventions
- All types in `src/types/index.ts` — single source of truth
- Store actions in `src/store/useFitStore.ts` — never mutate state outside store
- Screen files in `src/screens/` — one file per screen, StyleSheet at bottom
- Components in `src/components/` — reusable; domain components at root, UI kit in `ui/`
- Services in `src/services/` — pure functions, no React
- Theme from `src/theme/index.ts` — NEVER hardcode colors/spacing/radius

## How to add a new store action
```typescript
// In useFitStore.ts, inside the store object:
myAction: (param: string) => {
  const date = todayStr();
  get().ensureTodayLog();  // always call this first if touching logs[date]
  set((s) => ({
    logs: {
      ...s.logs,
      [date]: { ...s.logs[date], /* changes */ },
    },
  }));
},
```

## How to add a new screen
1. Create `src/screens/MyScreen.tsx`
2. Add to `RootStackParamList` in `AppNavigator.tsx`
3. Add `<Stack.Screen name="MyScreen" component={MyScreen} />` in AppNavigator
4. Navigate: `navigation.navigate('MyScreen', { param: value })`

## How to add a meal template
```typescript
// In src/data/mealTemplates.ts
{
  id: 'unique-id',
  name: 'Template Name',
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  dietPref: ['vegetarian'] | ['non-vegetarian'] | ['vegetarian','eggetarian','non-vegetarian'],
  cuisineRegion: ['south-indian'] | ['north-indian','pan-indian'] | ['pan-indian'],
  totalKcal: 450,
  totalProtein: 18,
  foods: [
    { name: 'Food Name', baseGrams: 200, kcalPer100g: 130, proteinPer100g: 2.7, scalable: true },
  ],
}
```

## Critical store patterns

### `ensureTodayLog()` — always first
Every action that touches `logs[date]` must call `get().ensureTodayLog()` first. Creates today's log from `mealPlan` if missing.

### Multi-food meal logging
- `addFoodToMeal(mealId, food)` — appends food, recalculates totals
- `removeFoodFromMeal(mealId, foodId)` — filters by id, recalculates
- `logMeal(mealId, kcal, protein, foods?)` — full log with optional food snapshot
- `unlogMeal(mealId)` — resets back to plan foods

### Store versioning
Current version: **6**. Migration in `migrate` function. Bump version when changing state shape. Add no-op migration comment for each bump.

### Date strings
Always `todayStr()` from store utils — returns `YYYY-MM-DD`. Never `new Date()` directly.

## Navigation patterns

### FoodSearch modes
```typescript
navigation.navigate('FoodSearch', { mealId: 'meal_1', mealName: 'Lunch', mode: 'add' })
// mode: 'add' → addFoodToMeal, shows "Add to [meal]" title, "Add more"/"Done" after confirm
// mode: 'replace' (default) → logMeal, replaces entire meal
```

### Streak badge → Analytics Streaks
```typescript
navigation.navigate('Tabs', { screen: 'Analytics', params: { initialTab: 'streaks' } })
// AnalyticsScreen reads route.params?.initialTab in useFocusEffect
```

## IF window calculation
```typescript
import { computeIfWindow } from '../services/planGenerator';
const window = computeIfWindow('16:8', '05:30', '23:00');
// → "6:30 AM – 2:30 PM"
// Offsets: 16:8=+1h, 18:6=+2h, 20:4=+4h from wakeTime
// End = min(start + eatHours, sleepTime - 60min)
```

## Cuisine filtering
```typescript
import { matchesCuisine } from '../services/planGenerator';
const fits = matchesCuisine(template, profile.cuisineRegion);
// 'pan-indian' → shows templates with no cuisineRegion OR pan-indian
// 'south-indian' → also shows south-indian templates
// Fallback: if no matches for user's cuisine, fall back to pan-indian
```

## Theme usage
```typescript
import { colors, spacing, radius, cardShadow, glow } from '../theme';
// NEVER: backgroundColor: '#FF7A59' ← hardcoded
// ALWAYS: backgroundColor: colors.primary
```

## Animation patterns
```typescript
// Pressable with spring scale
import PressableScale from '../components/anim/PressableScale';
<PressableScale onPress={fn}><View>...</View></PressableScale>

// Fade + slide in on mount
import FadeSlideIn from '../components/anim/FadeSlideIn';
<FadeSlideIn delay={i * 60}><Card /></FadeSlideIn>

// Count-up number animation
import { useCountUp } from '../hooks/useCountUp';
const display = useCountUp(targetNumber);
```

## Keyboard + modal pattern
Bottom sheet modals that contain text inputs need:
```tsx
<Modal ...>
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <TouchableOpacity style={styles.overlay} onPress={close} activeOpacity={1}>
      <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          {/* content */}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  </KeyboardAvoidingView>
</Modal>
```

## Cross-links
[[architecture]] [[domains/meal-planning]] [[anti-patterns]]

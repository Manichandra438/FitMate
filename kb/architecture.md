---
project: FitMate
confidence: high
last-verified: 2026-06-20
status: active
---

# Architecture

## What it does
Indian-focused calorie/macro tracker with AI meal planning, intermittent fasting timer, weight tracker, exercise log, streaks, and Firebase cloud sync.

## Key components

### State (`src/store/useFitStore.ts`)
Single Zustand store with AsyncStorage persist (version 6). ALL app state lives here.
Key slices: `profile`, `logs` (keyed by date `YYYY-MM-DD`), `mealPlan`, `exercisePlan`, `weightHistory`, `bodyMeasurements`, `customFoods`, `frozenDates`, `notifPrefs`.

### Types (`src/types/index.ts`)
Single file — all types. Key ones:
- `UserProfile` — all user settings (goals, wake/sleep, IF protocol, cuisineRegion, etc.)
- `DayLog` — one day's data: `meals: MealLog[]`, `water`, `weight`, `workouts`, `exercise`, `quickAdds`
- `MealLog` — logged meal with `foods: FoodItem[]`, `totalKcal`, `totalProtein`, `logged`, `skipped`
- `Meal` — planned meal (template-generated)
- `FoodItem` — single food with macros
- `MealTemplate` — template with `cuisineRegion?: CuisineRegion[]`
- `CuisineRegion` = `'north-indian' | 'south-indian' | 'pan-indian'`
- `FastingProtocol` = `'none' | '16:8' | '18:6' | '20:4'`

### Navigation (`src/navigation/AppNavigator.tsx`)
Bottom tabs: Home / Meals / Weight / Analytics / Settings
Stack screens on top: FoodSearch, Exercise, Water, EditProfile, BodyMeasurements, CustomFood, BarcodeScanner, EmailVerification, Login

### Services
| File | Purpose |
|------|---------|
| `planGenerator.ts` | Generates `Meal[]` from `OnboardingAnswers` + `PlanTargets`. Handles cuisine filter, IF meal times, macro scaling |
| `badges.ts` | `computeBadges()` — streak & achievement computation |
| `statsHelpers.ts` | `logKcal()`, weekly/daily stat calculations |
| `nutritionix.ts` | Nutritionix food search API |
| `openFoodFacts.ts` | Barcode scan fallback |
| `auth.ts` | Firebase email/password + Google Sign-In |
| `sync.ts` | Firestore dirty-queue sync — `flush()` pushes pending changes |
| `notifications.ts` | `scheduleAllNotifications()` — meal/water/exercise reminders |
| `export.ts` | JSON export of all user data |

### Screens
| Screen | Route | Purpose |
|--------|-------|---------|
| HomeScreen | Tabs/Home | Calorie ring, nutrition bars, water widget, streak badge → Analytics |
| MealsScreen | Tabs/Meals | Meal list + log modal (multi-food, add/swap/skip) |
| WeightScreen | Tabs/Weight | BMI, progress chart, history (tap=edit, long-press=delete) |
| AnalyticsScreen | Tabs/Analytics | Daily / Weekly / Streaks tabs, date range picker |
| SettingsScreen | Tabs/Settings | Profile, notifications, export, sign-out |
| ExerciseScreen | Stack/Exercise | Daily plan, custom workout log, 7-day burn history |
| WaterScreen | Stack/Water | Glass grid, tips |
| FoodSearchScreen | Stack/FoodSearch | Search + barcode, mode=add|replace |
| EditProfileScreen | Stack/EditProfile | Full profile edit → regenerates plan on save |
| OnboardingScreen | Stack/Onboarding | 10-step onboarding with plan generation at end |

### UI & Animations
- Theme: `src/theme/index.ts` — Soft & Friendly Light (coral primary, cream bg, warm charcoal text)
- Animations: `src/components/anim/` — PressableScale, FadeSlideIn, ConfettiBurst, WaterGlass
- UI kit: `src/components/ui/` — GradientCard, GradientButton, GlowRing, etc.
- Charts: victory-native (WeightChart, CalorieBalanceChart)

## Data flow
1. User action → store action → Zustand updates state → React re-renders
2. Persist middleware: every store write → AsyncStorage (local-first)
3. On auth: `flush()` pushes dirty queue to Firestore
4. Plan generation: `generatePlan(answers)` → `{ targets, mealPlan }` → `updateMealPlan(mealPlan)` + `setProfile(...)`

## External dependencies
| Dep | Use |
|-----|-----|
| Firebase | Auth (email+Google) + Firestore sync |
| Nutritionix | Food search (primary) |
| OpenFoodFacts | Barcode scan fallback |
| expo-notifications | Meal/water/weight reminders |
| expo-camera | Barcode scanner |
| expo-sensors | Step counter |
| react-native-android-widget | Home screen widget |
| victory-native | Charts |
| dayjs | Date handling |

## Entry points
- Dev: `npx expo start`
- Android build: `npx expo run:android`
- EAS build: `eas build --platform android --profile preview`
- Emulator: AVD `CopilotDevice` (adb)

## Cross-links
[[patterns]] [[domains/meal-planning]] [[domains/auth-sync]]

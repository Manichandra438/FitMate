---
date: 2026-07-12
type: engineering-guidelines-review
guidelines-source: kb/guidelines/ENGINEERING_GUIDELINES.md
status: partially-resolved
total: 7
critical: 0
major: 3
minor: 4
---

# Engineering Guidelines Review — 2026-07-12

## Summary

| Severity | Count | Open |
|----------|-------|------|
| Critical | 0   | 0 |
| Major    | 3   | 1 (M2) |
| Minor    | 4   | 0 |
| **Total** | **7** | **1** |

Sections reviewed: 1 (Core Principles), 2 (Architecture & Design), 3 (Project Structure), 4 (Naming), 5 (Functions), 6 (Error Handling), 7 (Testing), 8 (Git Workflow), 9 (Code Review — N/A, solo project), 10 (Security), 12 (Data & Persistence), 13 (Config & Secrets), 14 (Logging), 15 (Performance), 16 (Dependencies), 17 (Documentation), 18 (CI/CD), 19 (Concurrency & Async), 20 (Privacy), 21 (Accessibility & i18n), 23 (Tech Debt).

Sections marked N/A:
- §9 Code Review — solo-developer repo, no PR review process exists
- §11 API Design — app has no API it exposes (client-only, talks to Firebase/3rd-party APIs, not a server it owns)
- §20 Privacy & Compliance (partial) — no analytics/subprocessor pipeline built yet; Firebase/Google Sign-In are the only data processors, already scoped in README
- §22 Incident Response — no on-call/production service; single-developer mobile app
- §21 i18n — single-locale (English) app by design, not targeting multiple locales

## Major

### [M1] No test suite exists anywhere in the repo
- **Location:** repo-wide — no `tests/` or `__tests__/` directory, no test runner in `package.json` scripts or devDependencies
- **Guideline:** §7 Testing, §3 Project Structure ("tests/ mirroring src/"), §24 Definition of Done ("Tests written and passing")
- **Issue:** Zero automated tests. Business logic worth testing exists and is non-trivial (`computeIfWindow`/`matchesCuisine` in `src/services/planGenerator.ts`, the dirty-queue merge logic in `src/services/sync.ts`, store reducers in `src/store/useFitStore.ts`) but has no regression coverage. The 2026-06-20 KB session dump itself lists three bugs found only via manual emulator testing.
- **Fix:** Add a test runner (Jest is the Expo/RN default) and start with unit tests for pure functions in `src/services/planGenerator.ts` and `src/services/statsHelpers.ts` — no RN rendering needed for those, cheapest win first.
- **Status:** fixed

### [M2] No CI pipeline — lint/build/test never gate anything
- **Location:** repo-wide — no `.github/workflows/`, no ESLint/Prettier config at root
- **Guideline:** §18 CI/CD & Releases ("Every push runs CI: lint → build → test"), §24 Definition of Done ("Full CI green")
- **Issue:** Nothing enforces linting, type-checking, or (once they exist) tests before merge/build. `tsc --noEmit` isn't even wired as an npm script.
- **Fix:** Add a `typecheck` script (`tsc --noEmit`) and a minimal GitHub Actions workflow running install → typecheck → (future) test. Add ESLint with the Expo config as a fast follow.
- **Status:** open

### [M3] No accessibility labeling anywhere in the app
- **Location:** repo-wide — `accessibilityLabel`/`accessibilityRole` appear 0 times across `src/`, including icon-only buttons in `HomeScreen.tsx`, `SettingsScreen.tsx`, and custom controls like `src/components/ui/DrumPicker.tsx`
- **Guideline:** §21 Accessibility ("Target WCAG 2.1 AA," "labels tied to inputs, buttons that are buttons," custom controls need ARIA/accessibility props as a repair tool)
- **Issue:** Icon-only touchables and the custom `DrumPicker` wheel control (which replaced plain `TextInput`s — see KB patterns.md) have no accessible name, so a screen-reader user cannot identify or operate them.
- **Fix:** Add `accessibilityLabel`/`accessibilityRole` to icon-only `Pressable`/`TouchableOpacity` instances and to `DrumPicker` (e.g. `accessibilityRole="adjustable"` with `accessibilityValue`).
- **Status:** fixed

## Minor

### [N1] Empty catch blocks with no logging in `src/services/sync.ts`
- **Location:** `src/services/sync.ts:349`, `src/services/sync.ts:354` (`clearDirty`, `clearLastUid`), also `loadQueue`/`saveQueue` (lines 38-40, 46-48)
- **Guideline:** §6 Error Handling ("Never swallow errors silently... Minimum: log with context")
- **Issue:** `catch {}` / `catch { /* best effort */ }` with no `console.warn` — if `AsyncStorage.removeItem` fails on sign-out, there's no trace of it happening.
- **Fix:** Add `console.warn('...:', err)` inside each catch, matching the pattern already used in `flush()` (line 99) and `fetchLogsInBackground` (line 156).
- **Status:** fixed

### [N2] Empty catch blocks in `src/services/auth.ts`
- **Location:** `src/services/auth.ts:65-69` (`signUpWithEmail`), `src/services/auth.ts:92-96` and `:136-141` (`signOutAll`, `deleteAccount`)
- **Guideline:** §6 Error Handling (same rule as N1)
- **Issue:** Same silent-swallow pattern on auth-adjacent operations (email verification send, Google sign-out/revoke) — lower risk than N1 since these are genuinely optional side effects, but still unlogged.
- **Fix:** Add a `console.warn` in each catch for traceability, consistent with N1.
- **Status:** fixed

### [N3] `fetchLogsInBackground`/`fetchCloud` pull the entire logs subcollection then filter client-side
- **Location:** `src/services/sync.ts:137-143` and `:171-177`
- **Guideline:** §12 Data & Persistence ("fetch what you need in bounded, indexed queries"), §15 Performance ("Set explicit limits everywhere")
- **Issue:** `getDocs(collection(db, 'users', uid, 'logs'))` reads every log document ever written, then discards anything older than the 90-day `HYDRATE_DAYS` cutoff in JS. Read cost (and latency) grows with account age instead of staying bounded.
- **Fix:** Use a Firestore range query (`where(documentId(), '>=', cutoff)`, since doc IDs are `YYYY-MM-DD`) to bound the read server-side.
- **Status:** fixed

### [N4] No `typecheck`/`lint`/`test` npm scripts
- **Location:** `package.json` scripts block
- **Guideline:** §18 CI/CD, §24 Definition of Done
- **Issue:** Only `start`/`android`/`ios`/`web` scripts exist. There's no single command a contributor (or CI) can run to verify the project type-checks.
- **Fix:** Add `"typecheck": "tsc --noEmit"` at minimum; add `"lint"`/`"test"` once M2/M1 are addressed.
- **Status:** fixed (typecheck + test scripts added; lint deferred — depends on M2's ESLint setup, not approved this round)

## Resolution Log

- **M1** — fixed — 2026-07-12 — Added `jest`/`jest-expo@56.0.5`/`@types/jest` devDeps, `test` npm script, `jest` config block in `package.json`, `types: ["jest"]` in `tsconfig.json`. Wrote `tests/services/planGenerator.test.ts` (14 tests: `computeBMR`, `computeTargets` clamps/floors, `computeIfWindow`, `matchesCuisine`, `generatePlan`) and `tests/services/statsHelpers.test.ts` (10 tests: `logKcal`/`logProtein`/`logCarbs`/`logFat`, `computeTodayTotals`, `computeStreak` incl. frozen-date and today-not-yet-active cases). 24/24 passing, `tsc --noEmit` clean.
- **M3** — fixed — 2026-07-12 — Added `accessibilityLabel`/`accessibilityRole` to icon-only touchables with no visible text: `DrumPicker.tsx` (`adjustable` + live value), `WaterGlass.tsx` (state-aware label/hint), `IFInfoModal.tsx` + `WeeklyReportModal.tsx` (close buttons), `HomeScreen.tsx` (dismiss), `ExerciseScreen.tsx` (per-workout edit/remove), `FoodSearchScreen.tsx` (clear/scan/add-custom), `OnboardingScreen.tsx` (back arrow), `MealsScreen.tsx` (remove quick-add/food). Touchables with an already-visible text label were left untouched (scope minimization). Verified with `tsc --noEmit` (clean) and full Jest suite (24/24 still passing).
- **N1** — fixed — 2026-07-12 — Added `console.warn(...)` to all 5 empty catch blocks in `src/services/sync.ts`: `loadQueue`, `saveQueue`, the previous-user local-reset block in `startSync`, `clearDirty`, `clearLastUid`.
- **N2** — fixed — 2026-07-12 — Added `console.warn(...)` to the 3 empty catch blocks in `src/services/auth.ts`: `signUpWithEmail`'s verification-email send, `signOutAll`'s Google sign-out, `deleteAccount`'s Google revoke/sign-out.
- **N3** — fixed — 2026-07-12 — `fetchLogsInBackground` and `fetchCloud` in `src/services/sync.ts` now use `query(collection(...), where(documentId(), '>=', cutoff))` instead of fetching the whole `logs` subcollection and filtering client-side. Doc IDs are `YYYY-MM-DD`, so lexicographic `>=` bounds correctly server-side.
- **N4** — fixed — 2026-07-12 — Added `"typecheck": "tsc --noEmit"` npm script. `"test"` script already existed from M1. `"lint"` deferred — no ESLint config exists yet (that's M2's scope, not approved this round).
- **M2** — not addressed this round — user approved only M1, M3, and "minor issues" (N1-N4). Still open.

Verification for this round: `npx tsc --noEmit` clean, full Jest suite 24/24 passing after all N1-N4 changes.

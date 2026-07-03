---
project: FitMate
confidence: high
last-verified: 2026-06-20
status: active
---

# Anti-Patterns — What NOT to Do

## Hardcoded IF window times — 2026-06-20

**What failed:** IF option cards (EditProfile, Onboarding) showed "12 pm – 8 pm" hardcoded. FastingTimerCard on Home showed eatStart = wakeTime (no offset).
**Root cause:** `IF_OPTIONS` array had static `window` strings. FastingTimerCard didn't apply protocol offset (16:8=+1h, 18:6=+2h, 20:4=+4h from wake).
**How we fixed it:** Exported `computeIfWindow(protocol, wakeTime, sleepTime)` from planGenerator. Used it in all 3 places.
**Never do this because:** IF window shown on screen was inconsistent with actual meal times generated. User with 5:30 AM wake saw "12 pm – 8 pm" but meals were scheduled 6:30 AM–2:30 PM.
**Watch for:** Any new IF display that uses a hardcoded time string.

## Skipping `ensureTodayLog()` in store actions — 2026-06-20

**What failed:** Store actions that write to `logs[date]` can crash if today's log doesn't exist yet.
**Root cause:** `logs[date]` is only created lazily — first access of the day needs `ensureTodayLog()`.
**How we fixed it:** All log-writing actions call `get().ensureTodayLog()` before any `set()`.
**Never do this because:** `logs[date]` is undefined for new days — spreading undefined crashes.
**Watch for:** Any new store action that does `s.logs[date].*` without calling `ensureTodayLog()` first.

## Forgetting to bump store version — ongoing

**What failed:** Adding new fields to state shape without bumping version = old persisted state missing new fields.
**Root cause:** Zustand persist doesn't auto-migrate — version must be bumped and migration function updated.
**How we fixed it:** Current version = 6. Every state shape change bumps to next version with a migration entry.
**Never do this because:** Users upgrading from old app versions get undefined errors on new fields.
**Watch for:** Any PR adding new fields to store state without a version bump comment.

## Starting EAS build without explicit user approval — 2026-06-20

**What failed:** N/A — preserved as a rule.
**Root cause:** Build takes 10+ minutes and costs EAS build minutes.
**Never do this because:** User explicitly said "once I send the start the build then only start the build ok".
**Watch for:** Never run `eas build` or `npx expo run:android` (for emulator testing) unless user explicitly says "start the build" or "run the emulator".

## Negative weight delta display — 2026-06-20

**What failed:** WeightScreen showed "-1.0 Lost (kg)" and Analytics showed "Total weight lost -1.0 kg" in green when user gained weight.
**Root cause:** `startWeight - currentWeight` is negative when user gains. Label and color weren't conditional.
**How we fixed it:** Used `Math.abs()` for display value. Label switches "Lost"↔"Gained", color switches green↔orange based on sign of delta.
**Watch for:** Any stat that displays `startWeight - currentWeight` — always check sign before labeling.

## KeyboardAvoidingView missing in bottom sheet modals — 2026-06-20

**What failed:** Meal action modal's kcal input was completely covered by soft keyboard on Android.
**Root cause:** Bottom sheet modal with TextInput had no KAV wrapper. Android doesn't auto-adjust modal content.
**How we fixed it:** Wrapped modal content in `<KeyboardAvoidingView behavior="height">` + `<ScrollView keyboardShouldPersistTaps="handled">`.
**Watch for:** Any Modal containing TextInput on Android — always needs KAV + ScrollView.

## Cross-links
[[patterns]] [[architecture]]

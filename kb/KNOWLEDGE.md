---
project: FitMate
created: 2026-06-20
last-updated: 2026-06-20
---

# Brain Index — FitMate

## Quick Facts
- **What it is:** Indian-focused diet & fitness tracker — calorie logging, IF timer, meal planning, weight tracking, exercise log
- **Stack:** React Native 0.85 + Expo SDK 56, TypeScript, Zustand v5, Firebase, Reanimated v4
- **Bundle:** com.fitmate.app · v2.0.0
- **Entry points:** `App.tsx` → `AppNavigator.tsx` → tab screens

## Docs
| Doc | Topic | Status |
|-----|-------|--------|
| [architecture.md](architecture.md) | Components, data flow, store, services | active |
| [patterns.md](patterns.md) | Code conventions, store patterns, how to add features | active |
| [anti-patterns.md](anti-patterns.md) | Known failure modes and gotchas | active |
| [domains/meal-planning.md](domains/meal-planning.md) | Meal plan generation, templates, IF logic | active |
| [domains/auth-sync.md](domains/auth-sync.md) | Firebase auth + Firestore dirty-queue sync | active |
| [decisions/](decisions/) | Architecture decisions (ADRs) | active |
| [sessions/](sessions/) | Session brain dumps | active |

## Cross-links
- [[domains/meal-planning]] — most complex domain, cuisine + IF logic
- [[domains/auth-sync]] — Firebase patterns used here

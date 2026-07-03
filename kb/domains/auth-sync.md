---
topic: auth-sync
created: 2026-06-20
confidence: high
status: active
---

# Domain: Auth & Cloud Sync

## Auth providers
- Email/password: Firebase Auth (`auth.ts`)
- Google Sign-In: `@react-native-google-signin/google-signin`
- Email verification flow: `EmailVerificationScreen`

## Sync pattern (dirty queue)
`sync.ts` implements a local-first dirty queue:
1. All writes go to Zustand store (AsyncStorage persist) immediately
2. Changed keys are added to a dirty queue
3. `flush()` called after user actions to push dirty queue to Firestore
4. On sign-in: pull Firestore data → merge with local state

**Rule:** Never block UI on Firestore. Always update store first, sync in background.

## Sign-out behavior
On sign-out: clear local AsyncStorage + Zustand store. Re-login loads cloud data.
This prevents stale data from previous user session showing up.

## Auth state
`useAuth.ts` hook exposes `{ user, loading }`. `AppNavigator` switches between auth and main app based on this.

## Cross-links
[[architecture]] [[patterns]]

# FitMate 2.0

Personal diet planner & all-in-one tracker. Google Sign-In, cloud sync (Firestore), personalized diet plan generation, meal/water/weight/exercise tracking, data export, and an Android home-screen widget.

## One-time setup (required before building)

The app will not sign in until Firebase is configured. ~15 minutes:

### 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project** → name it `FitMate` (Analytics optional).

### 2. Add the Android app
1. Project overview → **Add app** → Android.
2. Package name: `com.fitmate.app` (must match exactly).
3. Skip the "download config" step for now — do step 3 first.

### 3. Add your EAS keystore SHA-1
1. In a terminal: `eas credentials -p android` → select the **preview/production keystore** → copy the **SHA-1 fingerprint**.
2. Firebase console → Project settings → Your apps → your Android app → **Add fingerprint** → paste SHA-1.

> Wrong/missing SHA-1 is the #1 cause of `DEVELOPER_ERROR` on Google Sign-In.

### 4. Download google-services.json
Project settings → Your apps → Android app → **Download google-services.json** → put it in the **project root** (next to `app.json`).

### 5. Enable Google sign-in
Firebase console → **Authentication** → Sign-in method → **Google** → Enable (set support email).

### 6. Fill in the web client ID
Open `google-services.json`, find the `oauth_client` entry with `"client_type": 3`.
Copy its `client_id` into `WEB_CLIENT_ID` in `src/services/firebase.ts`.

> Do NOT use the Android client ID (`client_type: 1`) — that causes `DEVELOPER_ERROR`.

### 7. Fill in the Firebase web config
Firebase console → Project settings → General → **Add app** → Web (</>) → register → copy the `firebaseConfig` object values into `src/services/firebase.ts`.

### 8. Create the Firestore database
1. Firebase console → **Firestore Database** → Create database → production mode → region close to you (e.g. `asia-south1`).
2. **Rules** tab → paste and publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 9. Build the APK
```bash
eas build -p android --profile preview
```
Download link arrives by email / in the terminal. Install on your phone (allow "Install unknown apps").

> Any change to `app.json` or plugins requires a new EAS build.

## Features

- **Google Sign-In** — one account, all your data in your own Google cloud.
- **Onboarding** — 10 questions (age, height, weight, goal, activity, diet preference, pace, schedule) → BMR/TDEE (Mifflin-St Jeor) → personalized calorie/protein/water targets and an Indian-style meal plan scaled to your goal.
- **Cloud sync** — local-first; every change is mirrored to Firestore (`users/{uid}` + `users/{uid}/logs/{date}`). Works offline; queued changes flush on reconnect. Reinstall + sign in = full restore.
- **Tracking** — meals (plus USDA food search), water, weight (chart + projection), exercise, streaks, analytics.
- **Export** — Settings → JSON (full backup) or CSV (daily summary + weights) via the share sheet.
- **Reset / Delete** — Settings → reset wipes local + cloud data and restarts onboarding; delete account removes the Firebase user entirely.
- **Home-screen widget** — long-press home screen → Widgets → FitMate: calories left, water, streak. Updates live while the app runs and every ~30 min in the background.

## Tech notes

- Expo SDK 56 / React Native 0.85, TypeScript, Zustand (+AsyncStorage), Firebase JS SDK v12 (RN persistence + Firestore long-polling), `@react-native-google-signin/google-signin`, `react-native-android-widget`, `expo-linear-gradient`, new `expo-file-system` File/Paths API.
- Widget library officially supports ≤ RN 0.83; if the widget misbehaves on this build, the code is isolated in `src/widgets/` and can be removed (1 plugin entry in app.json + 1 line in index.ts) without affecting the app.

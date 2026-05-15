# Wyjątkowe Serca — mobile app

React Native / Expo app that mirrors the `/app` section of the web frontend. Talks to the same backend (`https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app`) and the same Firebase Auth users.

Bundle ID (both iOS + Android): `pl.wyjatkoweserca.pacjent`.

## What's implemented

- Login screen with dev-user picker (works against `ENV=dev` backend) and a stub Google sign-in button
- Bottom-tab navigation: Profil pacjenta, Leki, Pomiary, Kalkulator INR
- All four screens with full CRUD against the existing backend endpoints
- Deep linking: `wyjatkoweserca://app/accept?token=…` opens the invite-accept screen
- TypeScript strict mode, Paper UI, react-hook-form-free state management

## What's NOT implemented yet (intentionally)

- **Real Google sign-in** — requires Firebase config (see *Adding Firebase* below). The dev-user picker is enough for end-to-end testing against a dev backend.
- **Apple sign-in** — planned for Phase 0 before App Store submission.
- **Push notifications** — punted to v2 per the plan.
- **EAS build / store submission** — needs paid Apple Developer + Google Play accounts (not yet purchased).
- **App icons & splash screen** — using Expo defaults until branded assets are added.

## Running locally

### Prerequisites

```bash
cd mobile
npm install
```

### Option A: Expo Go (fastest, no native build)

```bash
npm start
# scan the QR code with the Expo Go app on iOS or Android
```

Works for everything except real Google/Apple sign-in (those need a custom dev client). Use the dev-user picker instead.

For the dev-user picker to populate, the **backend must be running locally with `ENV=dev`**, because `GET /dev/users` is gated on that. Either:

1. **Point at local backend:** add to `mobile/app.json` under `extra`:
   ```json
   "apiUrl": "http://YOUR_LAN_IP:8000"
   ```
   then start backend: `cd backend && make run_dev`
2. **Or point at prod** and accept that the dev-user list will be empty (need real Google sign-in instead). The Banner on the login screen will show this state.

### Option B: Android emulator / iOS simulator

```bash
npm run android   # needs Android Studio + emulator
npm run ios       # needs Xcode (macOS only)
```

## Project layout

```
mobile/
├── app.json                      Expo config (bundle ID, scheme, plugins)
├── App.tsx                       Root: PaperProvider + AuthProvider + RootNavigator
├── src/
│   ├── api/
│   │   ├── client.ts             Typed fetch wrapper, auto-attaches Bearer token
│   │   └── config.ts             API base URL (reads app.json's extra.apiUrl)
│   ├── auth/
│   │   ├── AuthContext.tsx       user state, dev-user bypass + Firebase JS hook
│   │   └── firebase.ts           Firebase JS SDK init (no-ops if not configured)
│   ├── components/               SectionCard, MultiSelectModal, SelectMenu,
│   │                             DateTimePickerField, MetricChip, MiniLineChart,
│   │                             LogoutButton
│   ├── lib/                      Pure logic ported from web: inr math,
│   │                             medication next-dose calc, measurement helpers,
│   │                             patient-profile option lists
│   ├── navigation/               RootNavigator + MainTabs (with linking config)
│   ├── screens/                  LoginScreen, PatientProfileScreen,
│   │                             MedicationsScreen, PomiaryScreen, InrScreen,
│   │                             AcceptInviteScreen
│   ├── theme/                    colors + Paper theme
│   └── types/                    api.ts — mirrors backend/app/models.py
```

## Adding Firebase (when ready for real auth)

1. In the existing Firebase project, add an iOS app with bundle ID `pl.wyjatkoweserca.pacjent` and an Android app with the same package.
2. Note down the **web app's** apiKey/projectId/etc. (the JS SDK doesn't need the iOS/Android config files).
3. Add to `mobile/app.json` under `extra`:
   ```json
   "firebaseApiKey": "...",
   "firebaseAuthDomain": "...",
   "firebaseProjectId": "...",
   "firebaseStorageBucket": "...",
   "firebaseMessagingSenderId": "...",
   "firebaseAppId": "..."
   ```
4. Wire `expo-auth-session` (or `@react-native-google-signin/google-signin` if moving to native dev client) into `LoginScreen.handleGoogleSignIn`.

The `AuthContext` already supports a real Firebase user — once `isFirebaseConfigured` flips to true at startup, `onAuthStateChanged` becomes the source of truth.

## Migrating to native sign-in (later, for App Store)

Expo Go can't run native modules. When we add Apple sign-in / native Google sign-in:

```bash
# create a custom dev client
npx expo install @react-native-firebase/app @react-native-firebase/auth \
                 @react-native-google-signin/google-signin expo-apple-authentication expo-dev-client
eas build --profile development --platform all
```

After that, the dev client (not Expo Go) is what scans the QR code.

## Deep links

```
wyjatkoweserca://app/accept?token=XYZ
https://wyjatkoweserca.pl/app/accept?token=XYZ   (after universal-link setup)
```

Both route to the `AcceptInvite` screen via `expo-linking` configured in `navigation/RootNavigator.tsx`.

## Backend contract (cheat sheet)

All endpoints under `https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app`, all with `Authorization: Bearer <id_token>` (or `Bearer dev:<uid>` when backend is in `ENV=dev`):

- `GET / PUT /patient-profile`
- `GET / PUT /medications`
- `GET / PUT /inr`
- `GET / PUT /measurements`
- `POST /invite`  →  `{ token }`
- `GET /invite/{token}`  →  `{ ownerUid, childName, hasExistingData }`
- `POST /accept-invite/{token}`

Dev-only:
- `GET /dev/users`  →  `[{ uid, email }]` (only when backend `ENV=dev`)

## Type checking

```bash
npx tsc --noEmit
```

## Bundle verification

```bash
npx expo export --platform android --output-dir /tmp/exp_check
# (or --platform ios)
```

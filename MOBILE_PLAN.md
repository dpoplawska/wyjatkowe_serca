# Mobile app plan: porting `/app` to native iOS/Android

Status: Phase 0–6 code complete; wiring real Google sign-in next
Owner: Michał
Last updated: 2026-05-15

## 1. Goals & scope

**In scope (v1):** Feature parity with the existing `/app` section — login, patient profile, leki, pomiary, kalkulator INR, accept-invite (deep link).

**Out of scope (v1):** Push notifications for medication reminders, offline-first sync, the public charity site, admin panel.

**Constraint:** `/app` web stays live in production. Mobile shares the same backend and Firebase project. We do not touch `frontend/` or `backend/` code paths that aren't strictly necessary. The web `/app` may be deleted in the future once mobile is stable.

## 2. Locked-in decisions

- **Bundle ID** (both platforms): `pl.wyjatkoweserca.pacjent`
- **Auth providers**: Google sign-in + Apple sign-in. Google works on Android dev client today; Apple deferred until paid Apple Developer Program.
- **Push notifications**: deferred to v2
- **Repo strategy**: sibling project (`mobile/` next to `frontend/`), copy shared types/logic from web for now
- **Store accounts**: do not exist yet — must be created in parallel with Phase 7

## 3. Tech stack (as built)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 54 (managed-ish) | `expo prebuild` generates `android/` for local Gradle builds |
| Language | TypeScript strict | |
| Navigation | React Navigation v7 | Native stack + bottom tabs |
| UI kit | React Native Paper | MUI's closest cousin |
| Date pickers | `react-native-paper-dates` | matches Paper |
| Charts | `react-native-gifted-charts` | replaces web's `recharts` |
| Firebase | **Firebase JS SDK** (`firebase` npm pkg) | NOT `@react-native-firebase/*` — JS SDK is enough, works in Expo Go for everything except OAuth |
| Google sign-in | `@react-native-google-signin/google-signin` | Native module — requires dev build, not Expo Go |
| Token cache | `expo-secure-store` for dev-user | Firebase SDK handles its own session |
| Date utils | `dayjs` | same as web |
| Deep links | `expo-linking` | `wyjatkoweserca://app/...` + universal links |

Skipped intentionally: `@react-native-firebase/*` (JS SDK is sufficient), axios (use fetch), MUI X date pickers (Paper Dates instead), framer-motion (use `react-native-reanimated` only if needed).

## 4. Auth strategy (multi-tier)

We have **three** sign-in paths in code, picked by what's available:

| Tier | Method | Works in | Backend sees |
|---|---|---|---|
| 1 | **Dev-user picker** (calls `GET /dev/users` from local-dev backend) | Expo Go + any dev backend with `ENV=dev` | `dev:<uid>` token, bypasses Firebase verify |
| 2 | **Native Google sign-in** (`GoogleSignin.signIn()` → `signInWithCredential(auth, ...)`) | Dev client APK or production build, talking to prod or dev backend | Real Firebase ID token, identical to web |
| 3 | **Apple sign-in** (TODO) | iOS dev client/prod | Real Firebase ID token |

The web's `dev:` prefix bypass already exists in `backend/app/routes.py:verify_token`, gated on `ENV=dev`. We reused it as-is.

### Why no Google sign-in in Expo Go

`expo-auth-session`'s Google provider was deprecated for SDK 50+. The Expo auth proxy that powered it (`auth.expo.io`) was removed because Google blocked custom URL schemes. **In Expo Go, real Google sign-in is no longer possible** — you must build a dev client.

## 5. Backend contract

Backend changes needed: **none**. `firebase_auth.verify_id_token()` already accepts tokens from native SDKs (same Firebase project). The `Authorization: Bearer <token>` header is identical to web's contract.

All endpoints under `https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app`:

| Method | Path | Purpose |
|---|---|---|
| GET / PUT | `/patient-profile` | Load / save profile |
| GET / PUT | `/medications` | Load / save med list |
| GET / PUT | `/inr` | Load / save INR history |
| GET / PUT | `/measurements` | Load / save measurements |
| POST | `/invite` | Owner creates invite token |
| GET | `/invite/{token}` | Inspect invite |
| POST | `/accept-invite/{token}` | Guest accepts invite |
| GET | `/dev/users` | Dev-only — lists dev users for the login picker |

Backend `resolve_uid()` transparently redirects guest UIDs to the data owner's documents — mobile doesn't need to know.

## 6. Local Android build (free, no Expo account)

The dev toolchain at `~/android-sdk` matches the pomo project's setup. Required env:

```bash
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk
export ANDROID_NDK_HOME=$HOME/android-sdk/ndk/27.1.12297006
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

Two build flavors:

| Flavor | Command | Output | Use case |
|---|---|---|---|
| **Dev client** | `npx expo prebuild --platform android && cd android && ./gradlew assembleDebug` | `android/app/build/outputs/apk/debug/app-debug.apk` | Pairs with `expo start --dev-client`. JS hot reloads; only rebuild when native deps change. |
| **Preview APK** | `npx expo prebuild --platform android && cd android && ./gradlew assembleRelease` (needs signing config) | release APK | Self-contained, no Metro needed. Used like a real app. |

WSL2 gotcha (from pomo): add to `android/gradle.properties` if Kotlin builds hang:
```
kotlin.compiler.execution.strategy=in-process
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=2g
```

Pomo also uses `eas build --local --profile preview` as an alternative — it orchestrates prebuild + gradle inside an EAS runner running locally (still no cloud quota). Slightly tidier than raw gradle for release builds, but requires `eas init` (free Expo account).

## 7. iOS — what's possible without paying Apple

You're on Windows/WSL2 with no Mac.

| What you want | Cost | Possible? |
|---|---|---|
| iOS Simulator | Free | Needs a Mac — no |
| iOS device via Xcode + free Apple ID | Free | Needs a Mac — no |
| iOS device via EAS Build + sideload (AltStore) | Free, but 7-day re-sign cycle | Needs Mac or Windows running AltServer; fragile |
| iOS device via TestFlight or ad-hoc | $99/yr Apple Developer | Yes |
| iOS App Store submission | $99/yr | Yes |

**Practical conclusion:** iOS device testing waits until you pay Apple. The code is identical for both platforms — Android testing on a real device validates everything except platform-specific glue (Apple sign-in, iOS-specific UI quirks).

## 8. Dev workflow for the mobile app

### Quick test against prod backend (Expo Go, dev-user list disabled)

```bash
make mobile-start          # or: make mobile-tunnel  if LAN doesn't reach phone
# scan QR with Expo Go
```

Dev-user list won't populate (prod backend `ENV=prod` 404s `/dev/users`). Useful for testing UI without auth.

### Full test against local backend (Expo Go + dev-user login)

```bash
make mobile-dev-backend    # starts backend ENV=dev + localtunnel
# copy printed URL, paste into mobile/app.json -> extra.apiUrl
# press 'r' in Expo terminal to reload
```

Localtunnel: free, random URL each run, requires `bypass-tunnel-reminder: 1` header on requests (already wired in `api/client.ts`).

### Full test with real Google sign-in (dev client APK)

Once Google sign-in is wired (Phase 0a below):
```bash
make mobile-build-android  # builds dev client APK locally, ~3-5 min after first compile
# install APK on phone (replaces Expo Go for this app)
make mobile-start          # phone scans QR with dev client, not Expo Go
# tap "Sign in with Google" → real OAuth → talks to prod backend
```

## 9. Phases

### Phase 0 — Scaffold + dev-user login ✅ DONE

`mobile/` scaffolded, Paper theme, navigation, AuthContext (with dev-user bypass), API client, full screens for Profil, Leki, Pomiary, INR, AcceptInvite. Bundle: 1766 modules, clean typecheck, clean expo-doctor.

### Phase 0a — Real Google sign-in (in progress)

1. Install `@react-native-google-signin/google-signin` + `expo-dev-client` ✅
2. Add Firebase config to `app.json` extras ✅
3. Get **Web OAuth Client ID** from Firebase Console → Authentication → Sign-in method → Google → Web SDK config. Paste into `app.json` extras as `googleWebClientId`.
4. Wire `GoogleSignin.signIn()` → `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(auth, ...)` in LoginScreen.
5. Build first dev client APK locally (`make mobile-build-android`). This generates `~/.android/debug.keystore` if missing.
6. Get debug keystore SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android | grep SHA1`
7. Firebase Console → Project Settings → Add Android app → package `pl.wyjatkoweserca.pacjent` + SHA-1.
8. Install APK on phone, test sign-in. SHA-1 changes don't require an APK rebuild.

### Phase 7 — Polish & ship (~1 week + review wait)

- Splash screen, app icons, status bar
- Apple Developer + Google Play Console accounts (do in parallel; both need foundation legal docs)
- Store listings in Polish
- Privacy policy URL — reuse existing `PDF_PRIVACY`
- Submit for review

## 10. Makefile targets

```make
mobile-install            cd mobile && npm install
mobile-start              cd mobile && npx expo start
mobile-tunnel             cd mobile && npx expo start --tunnel
mobile-dev-backend        run backend with ENV=dev + public localtunnel
mobile-ios                npx expo start --ios   (needs Mac)
mobile-android            npx expo start --android  (needs Android emulator)
mobile-typecheck          npx tsc --noEmit
mobile-doctor             npx expo-doctor
mobile-build-android      (TODO) local APK build via prebuild + gradle
```

## 11. Data models to mirror

From `backend/app/models.py` → `mobile/src/types/api.ts`:

- `PatientProfileData` (with nested `Operacja`)
- `MedicationsData` (with nested `Lek`)
- `InrData` (with nested `InrEntry`)
- `MeasurementsData` (with nested `MeasurementEntry`)

Keep field names identical to the Python models — backend round-trips dicts directly.

## 12. Gotchas learned the hard way

1. **Expo Go can't do real Google sign-in.** Build a dev client for that flow. Dev-user picker covers everything else for testing.
2. **WSL2 networking doesn't reach the phone.** Use `--tunnel` for Metro and `localtunnel` (already wired into `make mobile-dev-backend`) for the backend.
3. **Localtunnel shows an interstitial on first visit.** The mobile API client sends `bypass-tunnel-reminder: 1` to skip it.
4. **`firebase_admin.initialize_app()` needs `GOOGLE_APPLICATION_CREDENTIALS`** pointing at `backend/service-account.json` for local dev. Already baked into `make mobile-dev-backend`.
5. **Localtunnel URL rotates per run.** Update `mobile/app.json` → `extra.apiUrl` and press `r` in Expo to reload. Stable subdomains require paid tier.
6. **iOS device testing needs $99/yr or a Mac.** No way around it.
7. **Apple Sign-in is mandatory by App Store review** once Google is offered. Wire it before submission.
8. **Kotlin daemon can hang on WSL2** during Gradle builds. Workaround in `gradle.properties` (see Phase 6).
9. **Bundle IDs are permanent** in stores. `pl.wyjatkoweserca.pacjent` is the final value.
10. **App Store medical-app review** is stricter. INR calculator must be framed as a tracker, not a diagnostic device. Add in-app disclaimer.

## 13. Open questions for later

- Push notifications: server-pushed (needs FCM + backend changes) vs local-only (no backend changes)? Defer to v2 planning.
- Offline mode: pure read-only cache, or full optimistic writes with conflict resolution? Defer to v2 planning.
- When `/app` web is sunset, do we redirect `/app/*` URLs to a "download the app" landing page?
- Shared `packages/` workspace eventually, or keep copy-paste? Decide when duplication actually hurts.

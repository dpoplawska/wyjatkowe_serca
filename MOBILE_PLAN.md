# Mobile app plan: porting `/app` to native iOS/Android

Status: planning
Owner: Michał
Last updated: 2026-05-15

## 1. Goals & scope

**In scope (v1):** Feature parity with the existing `/app` section — login, patient profile, leki, pomiary, kalkulator INR, accept-invite (deep link).

**Out of scope (v1):** Push notifications for medication reminders, offline-first sync, the public charity site, admin panel.

**Constraint:** `/app` web stays live in production. Mobile shares the same backend and Firebase project. We do not touch `frontend/` or `backend/` code paths that aren't strictly necessary. The web `/app` may be deleted in the future once mobile is stable.

## 2. Locked-in decisions

- **Bundle ID** (both platforms): `pl.wyjatkoweserca.pacjent`
- **Auth providers**: Google sign-in + Apple sign-in from day one (Apple required by App Store review when Google is present)
- **Push notifications**: deferred to v2
- **Repo strategy**: sibling project (`mobile/` next to `frontend/`), copy shared types/logic from web for now
- **Store accounts**: do not exist yet — must be created in parallel with Phase 0

## 3. Repo layout

```
wyjatkoweserca/
├── frontend/         (untouched)
├── backend/          (untouched)
├── mobile/           ← new
│   ├── app.json
│   ├── eas.json
│   ├── package.json
│   ├── google-services.json        (gitignored)
│   ├── GoogleService-Info.plist    (gitignored)
│   └── src/
│       ├── api/              fetch wrapper + typed endpoints
│       ├── auth/             AuthContext (RN flavor)
│       ├── navigation/       Stack + Tab navigators
│       ├── screens/          Login, Profil, Leki, Pomiary, Inr, AcceptInvite
│       ├── components/       shared UI bits
│       ├── theme/            colors, typography, paper theme
│       ├── types/            mirrored from backend/app/models.py
│       └── lib/              pure logic (INR math) copied from /app
└── Makefile          (add mobile targets)
```

**Sharing strategy:** for now, copy TS types and pure logic from `frontend/app/src/app/` into `mobile/src/`. Revisit once duplication hurts (probably after the first prod-bug-in-both moment). No monorepo plumbing yet.

## 4. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK (managed workflow) | EAS Build for cloud iOS/Android builds, no Xcode/Android Studio on day one |
| Language | TypeScript | strict mode |
| Navigation | React Navigation v7 | Native stack + bottom tabs |
| UI kit | React Native Paper | MUI's closest cousin; familiar API |
| Date pickers | `react-native-paper-dates` | matches Paper |
| Forms | `react-hook-form` | works as-is on RN |
| Charts (INR) | `victory-native` or `react-native-gifted-charts` | replaces `recharts` |
| Firebase | `@react-native-firebase/app` + `/auth` | native SDK, smoother than Firebase JS on RN |
| Google sign-in | `@react-native-google-signin/google-signin` | native flow |
| Apple sign-in | `expo-apple-authentication` | required by App Store |
| Token cache | Handled by RNFB automatically | no AsyncStorage code needed |
| Date utils | `dayjs` | same as web |
| Deep links | `expo-linking` | for `/app/accept` equivalent |

Skipped intentionally: axios (use fetch), MUI X date pickers (Paper Dates instead), framer-motion (use `react-native-reanimated`).

## 5. Backend changes

Effectively none. Verifications:
- `firebase_auth.verify_id_token()` already accepts tokens from native SDKs (same Firebase project).
- CORS: not relevant for native (no browser origin check).
- The `Authorization: Bearer <token>` contract is identical.

The `accept-invite` flow already works via `POST /accept-invite/{token}`. The mobile app just needs to handle `wyjatkoweserca://accept?token=…` (custom scheme) and universal/app links from `https://wyjatkoweserca.pl/app/accept`.

## 6. Prerequisites (run in parallel with Phase 0)

These do not block dev work but block shipping. Start immediately.

1. **Apple Developer Program** account for the foundation ($99/yr). Organizations need D-U-N-S verification, can take 24–72h, sometimes longer. Start this first.
2. **Google Play Console** account ($25 one-time, ~1–2 days verification).
3. Both need: foundation's legal name, address, contact. Banking/tax only matters if the app charges (it won't — both apps will be free).
4. Once Apple account is live, register `pl.wyjatkoweserca.pacjent` as an App ID in Apple Developer.
5. Add iOS and Android apps to the existing Firebase project (same project the web uses). Download `GoogleService-Info.plist` and `google-services.json`.

## 7. Migration phases

Each phase is independently shippable to TestFlight / Play Console internal testing.

### Phase 0 — Scaffold + auth (~3 days)

- `npx create-expo-app mobile --template`
- Install deps, configure `app.json` (bundle IDs, scheme, plugins for RNFB + Google sign-in + Apple auth)
- Add Firebase iOS + Android apps in console; download config files
- Implement `AuthContext` (Google + Apple sign-in, token getter, dev-token bypass mirroring the web's `dev:` prefix, keyed off `__DEV__` instead of `window.location.hostname`)
- Single screen: log in, hit `GET /patient-profile`, render JSON. Proves the full loop end-to-end.

### Phase 1 — Navigation shell (~1 day)

- Native stack: `Login` → authed tab navigator
- Bottom tabs: Profil / Leki / Pomiary / INR
- Header with user email + logout (replaces `AppHeader.tsx` hamburger logic — tabs do navigation now)

### Phase 2 — Patient Profile (~3–5 days)

The biggest form; sets the UI pattern for everything else.

- `react-hook-form` for state
- Dynamic `przebyte_operacje` list (add/remove rows)
- Multi-select for `wada_serca`
- Conditional sections for `zaburzenia_rytmu`, `rozrusznik_serca`, `powiklania`, `dodatkowe_choroby`, `zespoly_genetyczne`
- Wire `GET` + `PUT /patient-profile`

### Phase 3 — Medications (~3–5 days)

- List with CRUD (`Lek` model)
- Dose tracking (history, next-dose calculation — copy logic from web verbatim)
- Stretch: local notifications via `expo-notifications` for dose reminders (drop if not cheap; this is v1 only if free)

### Phase 4 — Pomiary (~3–5 days)

- Entry list (saturacja, tętno, ciśnienie skurczowe/rozkurczowe, diureza)
- Add/edit/delete entries
- Optional: trend chart per metric

### Phase 5 — INR Calculator (~3–5 days)

- Port pure INR/PT/ISI math verbatim to `mobile/src/lib/inr.ts`
- Trend chart via `victory-native`
- Wire `GET` + `PUT /inr`

### Phase 6 — Accept invite via deep link (~1–2 days)

- `expo-linking` for custom scheme + universal links
- Confirmation screen mirroring `AcceptInvite.tsx`
- Universal-link setup: add Apple `apple-app-site-association` + Android `assetlinks.json` to the web hosting (Firebase Hosting public dir) so `https://wyjatkoweserca.pl/app/accept?token=…` opens the app

### Phase 7 — Polish & ship (~1 week of work + review wait time)

- Splash screen, app icons, status bar styling
- `eas.json` build profiles: `development` (dev client builds), `preview` (internal distribution), `production`
- TestFlight internal testing + Play Console internal track
- Store listings in Polish: name, short/long description, screenshots, keywords, category (Medical)
- Privacy policy URL — reuse existing `PDF_PRIVACY` (or HTML version)
- Submit for review (Apple: 24–72h typical; Google: hours to a day)

**Total dev time:** ~3–5 weeks focused work + calendar time for store verification & review.

## 8. Makefile additions

```make
mobile-install:
	cd mobile && npm install

mobile-start:
	cd mobile && npx expo start

mobile-ios:
	cd mobile && npx expo run:ios

mobile-android:
	cd mobile && npx expo run:android

mobile-build-preview:
	cd mobile && eas build --profile preview --platform all

mobile-build-prod:
	cd mobile && eas build --profile production --platform all

mobile-submit:
	cd mobile && eas submit --platform all
```

## 9. Gotchas to remember

1. **Apple requires Sign-in-with-Apple** any time you offer a third-party sign-in (Google). Already baked into Phase 0.
2. **Bundle IDs are permanent** in stores. `pl.wyjatkoweserca.pacjent` is the chosen final value.
3. **Google sign-in on Android** needs SHA-1 fingerprints registered in Firebase for both the EAS-managed signing key and any debug key. EAS provides the SHA-1 after the first build.
4. **App Store medical-app review** is stricter. INR calculator must be framed as a tracker, not a diagnostic device. Add clear in-app disclaimer.
5. **Token freshness:** RNFB persists the user across app restarts, but `getIdToken()` should be awaited before each API request to get a fresh token (same as web).
6. **Dev login (`dev:` prefix)** in `AuthContext` is currently gated on `window.location.hostname === 'localhost'` on web. On mobile, gate on `__DEV__`.
7. **`recharts` has no direct equivalent.** `victory-native` is the closest. If INR chart needs custom interactions, budget extra time in Phase 5.

## 10. API surface the mobile app talks to

All under same prod URL (`https://wyjatkowe-serca-f74jtttkrq-lm.a.run.app`), all with `Authorization: Bearer <id_token>` unless noted.

| Method | Path | Purpose |
|---|---|---|
| GET | `/patient-profile` | Load profile |
| PUT | `/patient-profile` | Save profile |
| GET | `/medications` | Load med list |
| PUT | `/medications` | Save med list |
| GET | `/inr` | Load INR history |
| PUT | `/inr` | Save INR history |
| GET | `/measurements` | Load measurements |
| PUT | `/measurements` | Save measurements |
| POST | `/invite` | Owner creates invite token |
| GET | `/invite/{token}` | Inspect invite before accepting |
| POST | `/accept-invite/{token}` | Guest accepts invite |

Backend `resolve_uid()` transparently redirects guest UIDs to the data owner's documents — mobile doesn't need to know.

## 11. Data models to mirror in `mobile/src/types/`

From `backend/app/models.py`:

- `PatientProfileData` (with nested `Operacja`)
- `MedicationsData` (with nested `Lek`)
- `InrData` (with nested `InrEntry`)
- `MeasurementsData` (with nested `MeasurementEntry`)

Keep field names identical to the Python models — backend round-trips dicts directly.

## 12. Open questions for later

- Do we want a single shared `packages/` workspace eventually, or keep copy-paste indefinitely?
- Push notifications: server-pushed (needs FCM + backend changes) vs local-only (no backend changes)? Defer to v2 planning.
- Offline mode: pure read-only cache, or full optimistic writes with conflict resolution? Defer to v2 planning.
- When `/app` web is sunset, do we redirect `/app/*` URLs to a "download the app" landing page?

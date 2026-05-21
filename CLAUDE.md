# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wyjątkowe Serca — a Polish charitable foundation website with a patient-facing mobile app. Two independent subprojects: a React frontend and a FastAPI backend.

## Commands

Prefer `make` targets from the root `Makefile` over running subproject commands directly.

### Common make targets

```bash
make run_frontend       # cd frontend/app && npm start
make run_dev            # ENV=dev pipenv run uvicorn app.main:app --reload
make run                # pipenv run uvicorn app.main:app --reload
make install            # pipenv install --skip-lock

make dev                # docker compose -f docker-compose.dev.yml up
make dev-rebuild        # docker compose up --build (all services)
make dev-rebuild-frontend
make dev-rebuild-backend

make deploy-backend     # gcloud run deploy to Cloud Run (europe-central2)
make deploy-frontend    # npm run build + firebase deploy --only hosting
make deploy             # deploy-backend then deploy-frontend
```

### Frontend (`frontend/app/`) — if running directly

```bash
npm start          # dev server (uses craco, not react-scripts directly)
npm run build      # production build (source maps disabled)
npm test           # run tests
```

Uses CRACO on top of Create React App. No `tsconfig.json` — CRA manages TypeScript internally.

### Backend (`backend/`) — if running directly

```bash
ENV=dev pipenv run uvicorn app.main:app --reload    # dev server (port 8000)
pipenv install --skip-lock                          # install deps
```

Requires environment variable `ENV=dev` or `ENV=prod`. In dev, Firebase Admin SDK reads credentials from `service-account.json` (not committed). Secrets loaded from `secrets_dev.json` / `secrets.json`.

## Architecture

### Two distinct sections in the frontend

**Public site** (`src/sections/`) — charity fundraiser pages, shop, beneficiaries. Uses Bootstrap + React Bootstrap, CSS files in `src/sections/css/`.

**Patient app** (`src/app/`) — authenticated SPA at `/app/*`. Uses MUI v6 + inline styles only (no CSS files). Routes: `/app` (login), `/app/profil-pacjenta`, `/app/leki`, `/app/pomiary`, `/app/kalkulator-inr`.

`App.tsx` detects `pathname.startsWith('/app')` to hide the public `Menu` and `Footer`. `AuthProvider` wraps everything.

### Auth flow

Firebase Auth (Google sign-in) → ID token → `Authorization: Bearer <token>` header on every API call → backend `verify_token` dependency validates via `firebase_auth.verify_id_token()` → returns `uid` used as Firestore document key.

### Backend data model

Each patient's data is stored as a single Firestore document keyed by Firebase `uid`:
- `patientProfiles/{uid}` — profile
- `medications/{uid}` — medication list
- `inrHistory/{uid}` — INR entries array
- `measurements/{uid}` — measurement entries array

All patient-facing endpoints use `Depends(verify_token)`. Public/payment endpoints are unauthenticated. Admin endpoints use `x-password` header checked against `ACCESS_PASSWORD` env var.

### Shared frontend styles

`src/app/appStyles.ts` exports a `shared` object with common layout styles (page, main, pageTitle, saveBtn, etc.) spread into the `s` style object in each app page component.

`src/app/config.ts` exports `API` — the hardcoded production API base URL.

## Key conventions

- Import `.tsx` extensions explicitly in import statements
- All styling in the app section uses inline style objects; `sx` prop for MUI overrides
- No env variable for API URL — it's hardcoded in `config.ts`

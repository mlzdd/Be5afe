# Be5afe — Agent & Developer Entry Point

> Read this first. Everything else is referenced from here.

Last updated: 2026-05-17

---

## What this project is

**Be5afe** is a React Native / Expo travel safety app. It is two things simultaneously:

1. **A software product** — a modular mobile app built with TypeScript, Expo SDK 53, Firebase, and React Navigation.
2. **A travel-safety information product** — the app's core value is scam intelligence, safety data, and verified travel guidance. The data layer is as important as the code layer.

Both dimensions matter. An agent that treats this as only a software project will miss half the context.

---

## Two repos — understand the distinction

| Repo | Path | Role |
|---|---|---|
| **Be5afe** (this repo) | `/Users/rm/code/Be5afe` | Active development. The modular rebuilt app. Work here. |
| **bsafe** (legacy) | `/Users/rm/code/bsafe` | Original codebase. Source of governance docs, seed data, and historical decisions. Do not develop here. |

The active planning and data documents live in `docs/plans/` in this repo:

- `docs/plans/0_MODULAR_APP_PLAN.md`
- `docs/plans/1_MODULAR_APP_PLAN_PHASES_AS_BUILT.md`
- `docs/plans/3_DATA_ACQUISITION_GOVERNANCE.md`
- `docs/plans/4_DATA_PLATFORM_DESIGN.md`
- `docs/plans/5_DATA_PLAN_AS_BUILT.md` — data pipeline phases (D1–D9), tracked as built

The legacy `bsafe` repo remains useful for historical archaeology and seed data only; do not treat its copies of these documents as canonical.

---

## Expo version

**Expo SDK 53.** Read the exact versioned docs before writing any code:
https://docs.expo.dev/versions/v53.0.0/

Do not rely on training-data knowledge of Expo APIs — they change significantly between SDK versions.

---

## Architecture: one-way dependency rule

```
shared/  →  modules/  →  products/  →  app/
               ↑
             infra/
```

| Layer | Path | What lives here |
|---|---|---|
| `shared/` | `src/shared/` | Contracts (interfaces), theme, utils. Zero React Native deps. |
| `modules/` | `src/modules/` | Reusable feature hooks and screens. Depends only on `shared/`. |
| `products/bsafe/` | `src/products/bsafe/` | BSafe-specific business logic. Depends on `shared/` and `modules/`. |
| `infra/` | `src/infra/` | Concrete implementations of `shared/` contracts (Firebase, AsyncStorage, Expo, Google). Never imported by `modules/` or `products/`. |
| `app/` | `src/app/` | Navigation, screens, providers. Wires everything together. |

**The rule is enforced, not aspirational.** If you find yourself importing `@infra/*` from `modules/` or `products/`, that is a violation — fix it with dependency injection instead.

### Path aliases

```
@shared/*   → src/shared/*
@modules/*  → src/modules/*
@products/* → src/products/*
@infra/*    → src/infra/*
@app/*      → src/app/*
```

---

## Key technical facts

- **Language:** TypeScript strict mode throughout
- **Navigation:** React Navigation v7, native stack + bottom tabs
- **Firebase:** JS SDK (`firebase` npm package v12) — NOT `@react-native-firebase`. No native modules. All config via `EXPO_PUBLIC_FIREBASE_*` env vars.
- **Database:** Firestore (with Android `experimentalForceLongPolling`)
- **Auth:** Firebase Auth with `AsyncStorage` persistence via `getReactNativePersistence`
- **Maps:** `react-native-maps`, `PROVIDER_GOOGLE` on Android
- **Places:** Google Places API via `GooglePlacesClient` in `@infra/places/google/`
- **Location:** `ExpoLocationService` in `@infra/location/expo/`
- **AI chat:** Gemini 2.5 Flash via `GeminiClient` in `@infra/ai/gemini/`
- **Weather:** Open-Meteo API (free, no key required)
- **Local storage:** AsyncStorage for device-local preferences and caches
- **Tests:** Jest, split into two projects — `logic` (node env, `.test.ts`) and `rn` (jest-expo, `.test.tsx`)

---

## Environment setup

All credentials live in `.env` (gitignored). Copy `.env.example` and fill in:

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_GEMINI_API_KEY
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
FIREBASE_PROJECT_ID          ← Admin SDK only (migration scripts, never shipped to device)
FIREBASE_CLIENT_EMAIL        ← Admin SDK only
FIREBASE_PRIVATE_KEY         ← Admin SDK only
```

The app boots cleanly without credentials — Firebase-backed features degrade gracefully, static-data screens work fully offline. You do not need credentials to run the app in development.

**Firebase project:** `be5safe` (existing project, already seeded with data)

---

## Current build status

**Phases 1–18 complete** (app phases). **72 tests, 12 suites, all passing.**

See `MODULAR_APP_PLAN_PHASES_AS_BUILT.md` for the full phase-by-phase record of what was built, key decisions made, and bugs fixed. This is the authoritative source for "why does X work this way."

### What is built and working

| Area | Status |
|---|---|
| Auth (Firebase + guest mode) | ✅ |
| Home screen with 15 quick-action tiles | ✅ |
| Trips — full CRUD, add/edit flow, itinerary, bookings | ✅ |
| Emergency contacts + country numbers | ✅ |
| Scam alerts (static data + Firestore seeded) | ✅ |
| Country safety + details + local laws | ✅ |
| Guides screen (safety / scams / tips tabs) | ✅ |
| Health guide (general + per-country) | ✅ |
| Local apps directory | ✅ |
| Map tab (Places API, category filter) | ✅ |
| Nearest hospital (map + list) | ✅ |
| Safe zones (police + embassy map) | ✅ |
| Weather (Open-Meteo, GPS auto-locate, 7-day) | ✅ |
| Currency converter | ✅ |
| Packing list | ✅ |
| Travel documents | ✅ |
| Emergency medical card | ✅ |
| Friends + social (Firestore) | ✅ |
| Groups + group chat (Firestore) | ✅ |
| Widgets dashboard | ✅ |
| Chat (Gemini AI) | ✅ |
| Error boundary + loading states | ✅ |
| Firestore data seeded (32 countries, 54 scams) | ✅ |

### What remains

| Area | Status | Blocker |
|---|---|---|
| Packing list → Firestore sync | ⏳ | Decided, not yet implemented |
| Medical card → Firestore sync | ⏳ | Decided, not yet implemented |
| ScamReport submission (user-facing) | ⏳ | Needs scam report pipeline |
| AI triage Cloud Function | ⏳ | Needs ScamReport submission first |
| Admin portal v1 | ⏳ | Unblocked — canonical IDs decided (Decision 12) |
| Official alert feeds (DFAT/FCO/State Dept) | ⏳ | Independent, unblocked |
| Wikidata emergency numbers seed | ⏳ | Independent, unblocked |
| Build-time seed export + app-start diff fetch | ⏳ | Needs admin portal first |
| GDPR deletion flow implementation | ⏳ | Pre-launch requirement |
| App Store build (EAS, icons, splash) | ⏳ | Needs Apple/Google dev accounts |

---

## Data layer — read these before touching data

Two companion documents in this repo define the full data strategy:

### `docs/plans/3_DATA_ACQUISITION_GOVERNANCE.md`
What data, from where, by whose authority. Covers:
- 18 explicit decisions on data sourcing, trust tiers, lifecycles, and legal obligations
- ScamPattern and ScamReport full lifecycle state machines
- Trust tier labels (Confirmed / Reported / Flagged) and their meaning
- Emergency numbers policy (only `confidence: 'high'` records shown)
- Personal data persistence decisions (what goes to Firestore vs AsyncStorage)
- Account deletion scope (Decision 18, 30-day SLA)
- Admin portal v1 scope (5 screens)

### `docs/plans/4_DATA_PLATFORM_DESIGN.md`
How the system stays operationally correct. Covers:
- Firestore collection model and field conventions
- Event model (`events/` append-only collection, 19 event types)
- Diff/export/tombstone protocol (content manifest, export version, tombstones)
- Geospatial indexing (`geohash` field on coordinate-bearing documents, `geofire-common`)
- Schema versioning (`schemaVersion` field, migration script conventions)
- Idempotency rules (natural keys per entity, seed/feed/Cloud Function patterns)
- PII classification (5 tiers, field-level map)
- Analytics path (BigQuery as intended sink, `events/` as current analytical floor)

### `docs/plans/5_DATA_PLAN_AS_BUILT.md`
Data pipeline phases D1–D9 with dependency chain, scope, and acceptance criteria. Updated as each phase completes.

**Do not design new data features without reading both documents first.** The decisions in them are load-bearing.

---

## Dependency injection pattern

Repositories are never instantiated inside hooks or components. They are created once as module-level singletons in `AppProviders.tsx` and passed down via context.

```typescript
// AppProviders.tsx — singletons at module level
const tripsRepo = new FirestoreTripsRepository(db);

// Hook signature — accepts repo as parameter
function useTrips(repo: TripsRepository, userId: string | null): TripsState

// Context — wires hook to singleton
const trips = useTrips(tripsRepo, session.uid ?? null);
```

This means all hooks are testable in isolation by passing a mock repository. The test suite relies on this pattern — do not break it.

---

## Firebase null-safety pattern

The app boots without Firebase credentials. Every infra file guards against a null `db` or `auth`:

```typescript
// firebaseApp is null if credentials are absent
export const firebaseApp = hasFirebaseConfig ? initializeApp(...) : null;
export const db = firebaseApp ? initializeFirestore(firebaseApp, ...) : null;

// Repos guard all operations
function requireDb() {
  if (!db) throw new Error('Firestore not initialised');
  return db;
}

// Subscriptions return empty + no-op unsubscribe when db is null
subscribeToTrips(userId, callback) {
  if (!db) { callback([]); return () => {}; }
  ...
}
```

Do not remove these guards. The app must remain bootable without credentials for development and testing.

---

## Test conventions

```bash
npx jest              # run all tests
npx tsc --noEmit      # typecheck
```

- `logic` project: pure TypeScript, node environment. All `.test.ts` files.
- `rn` project: jest-expo preset. All `.test.tsx` files (component tests).
- Subscription callbacks in tests must fire asynchronously (`setTimeout(0)`) — React 19 throws on synchronous `setState` during mount.
- All test files set `(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true`.

**Always run both typecheck and tests before considering a change complete.**

---

## Navigation

Two navigators:

- `RootNavigator` (`src/app/navigation/RootNavigator.tsx`) — auth gate + full-screen stack (29 routes)
- `BottomTabNavigator` (`src/app/navigation/BottomTabNavigator.tsx`) — 5 tabs: Home, Guides, Map, MyTrips, Settings

Route types in `src/app/navigation/types.ts`. When adding a new screen:
1. Add the route name + params to `RootStackParamList`
2. Register a `Stack.Screen` in `RootNavigator`
3. Import the screen component at the top of `RootNavigator`

---

## Infra layer summary

| Repository | Contract | Backing store |
|---|---|---|
| `FirebaseAuthRepository` | `AuthRepository` | Firebase Auth + Firestore user profile |
| `FirestoreTripsRepository` | `TripsRepository` | `users/{uid}/trips` |
| `AsyncStorageEmergencyRepository` | `EmergencyRepository` | AsyncStorage |
| `FirestoreFriendsRepository` | `FriendsRepository` | Firestore `friendships`, `friendRequests` |
| `FirestoreGroupsRepository` | `GroupsRepository` | Firestore `groups`, `messages` subcollection |
| `FirestoreLocationSharingRepository` | `LocationSharingRepository` | Firestore `locationShares` |
| `FirestoreLocationRepository` | `LocationRepository` | Firestore |
| `GooglePlacesClient` | `PlacesClient` | Google Places API |
| `ExpoLocationService` | (direct) | `expo-location` |
| `GeminiClient` | `ChatCompletionClient` | Gemini 2.5 Flash |
| `MockChatClient` | `ChatCompletionClient` | In-memory (used in ChatAppScreen) |

---

## Canonical data model (decided, not yet fully implemented)

IDs use a hybrid semantic/opaque strategy:

| Entity | ID format | Example |
|---|---|---|
| Country | ISO alpha-2 | `TH`, `GB` |
| Locality | `{countryId}-{slug}` | `TH-bangkok`, `ID-bali` |
| ScamGroup | semantic slug | `tuk-tuk-overcharging` |
| ScamPattern | UUID / opaque | `pattern_...` |
| ScamReport | UUID / Firestore auto-id | opaque |
| Alert (feed-sourced) | `{source}-{sourceNativeId}` | `dfat-TH-2025-04` |
| Alert (BSafe editorial) | UUID / opaque | opaque |
| Personal user records | UUID / Firestore auto-id | opaque |

Locality replaces the old `CityId` concept. A Locality can be a city, island, region, district, or resort area — whatever matches how travellers think about a place.

---

## Things that will surprise you if you don't know them

1. **`CityId` is being replaced by `LocalityId`** — the data model uses a flexible Locality entity, not a strict city hierarchy. See `DATA_ACQUISITION_GOVERNANCE.md` Decision 13.

2. **Emergency numbers are withheld unless `confidence: 'high'`** — unverified countries show a "contact your embassy" message, not the unverified number. This is intentional. See Decision 6.

3. **Auto-published ScamReports must look visually distinct from Confirmed patterns** — this is a product quality requirement enforced at the design-system level, not just a data model concern. See Decision 3 + UI implementation requirement note.

4. **The `events/` Firestore collection is append-only** — never update or delete events (except under a documented legal process). They are the audit trail and calibration data source.

5. **Tombstones live in `contentManifest/current`** — when a ScamPattern is archived or unpublished, a tombstone entry is written to the manifest so offline clients know to hide it. A simple `updatedAt` query will not catch deletions/unpublishing.

6. **`geohash` is a derived field, not the source of truth** — always recomputable from `coordinates`. Classified as `sensitive_personal` because it is derived from precise location data.

7. **The admin portal is a pre-launch requirement** — not a post-launch nice-to-have. BSafe cannot operate its content pipeline through the Firebase console alone. See Decision 10.

8. **30-day deletion SLA is a legal commitment** — once it appears in the privacy policy it is binding. Do not design async deletion workflows that cannot complete within 30 days.

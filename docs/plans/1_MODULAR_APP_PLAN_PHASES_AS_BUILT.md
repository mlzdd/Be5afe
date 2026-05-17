# Be5afe — Modular App Plan: Phases As Built

Last updated: 2026-05-16  
Status: Phases 1–18 complete (except Phase 19 App Store). 72 tests across 12 suites, all passing.

---

## Architecture Overview

One-way dependency rule — enforced at every layer:

```
shared/  →  modules/  →  products/  →  app/
               ↑
             infra/  (implements shared contracts; no upward deps)
```

- **`shared/`** — contracts (interfaces), theme, utils. No React Native deps.
- **`modules/`** — reusable feature hooks and screens (auth, chat, maps, social, regional-data, user-preferences). Depend only on `shared/`.
- **`products/bsafe/`** — BSafe-specific business logic (trips, emergency, widgets, travel-tools, safety-data). Depend on `shared/` and `modules/`.
- **`infra/`** — concrete implementations of `shared/` contracts (Firebase, AsyncStorage, Expo, Google). Never imported by `modules/` or `products/`.
- **`app/`** — navigation, screens, providers. Wires everything together. Imports from all layers.

**Dependency injection pattern:** All hooks accept a repository interface as a parameter. Concrete implementations are instantiated once as module-level singletons in `AppProviders.tsx` and passed in.

**Path aliases** (`tsconfig.json` + `jest.config.js`):
```
@shared/*   → src/shared/*
@modules/*  → src/modules/*
@products/* → src/products/*
@infra/*    → src/infra/*
@app/*      → src/app/*
```

---

## Phase 1 — Shared: Theme

**Files:**
- `src/shared/theme/colors.ts` — `colors` (light) and `darkColors` objects; brand greens (`brandLight: #badcdb`, `brandDark: #013220`), semantic tokens (card, background, input, safety, alert, avoid, recommended)
- `src/shared/theme/typography.ts` — `typography` object with variants: brand, h1–h4, body, bodyLarge, bodySmall, caption, button, label
- `src/shared/theme/spacing.ts` — `spacing` (xs→6xl), `layout`, `radius`
- `src/shared/theme/shadows.ts` — shadow presets
- `src/shared/theme/animations.ts` — duration/easing constants
- `src/shared/theme/icons.ts` — icon name constants
- `src/shared/theme/ThemeContext.tsx` — `ThemeProvider` (wraps children, exposes `useTheme()`), `mode: 'light' | 'dark'`
- `src/shared/hooks/useTheme.ts` — returns `Colors` from context
- `src/shared/theme/index.ts` — re-exports `colors`, `darkColors`, `spacing`, `typography`, `ThemeProvider`, `useTheme`

**Key decisions:**
- Static `colors` import used in most screens (not dynamic theme) for simplicity
- Dark mode supported via `ThemeProvider` + `useTheme()` for components that need it

---

## Phase 2 — Shared: Contracts

**Files:**
- `src/shared/contracts/AuthRepository.ts` — `AuthUser { uid, email, displayName }`, `AuthRepository` interface (signUp, signIn, signOut, resetPassword, onAuthStateChanged), typed error classes (AuthEmailInUseError, AuthInvalidEmailError, etc.)
- `src/shared/contracts/TripsRepository.ts` — `TripsRepository` (subscribeToTrips, addTrip, updateTrip, deleteTrip, addActivity, updateActivity, deleteActivity, addBooking, deleteBooking); re-exports types from `@products/bsafe/trips/types`
- `src/shared/contracts/EmergencyRepository.ts` — `EmergencyRepository { load(userId), save(userId, contacts) }`
- `src/shared/contracts/SocialRepository.ts` — `FriendsRepository`, `GroupsRepository`, `LocationSharingRepository`; types: Friend, FriendRequest, UserSearchResult, Group, GroupMember, GroupMessage, LocationShare, ShareRecipient, ShareDuration; typed domain errors (SocialNetworkError, SocialNotFoundError, SocialPermissionError)
- `src/shared/contracts/ChatCompletionClient.ts` — `ChatCompletionClient { complete(request) }`, typed errors (ChatNetworkError, ChatRateLimitError, ChatAuthError, ChatTimeoutError)
- `src/shared/contracts/PlacesClient.ts` — `PlacesClient`, `LatLng`, place types
- `src/shared/contracts/LocationRepository.ts` — `LocationRepository`

**Key decisions:**
- Vendor error codes never cross the infra boundary — all errors translated to typed domain error classes
- `TripsRepository` re-exports domain types so callers only need one import path

---

## Phase 3 — Shared: Utils

**Files:**
- `src/shared/utils/format.ts` — currency formatting, date formatting helpers
- `src/shared/utils/geo.ts` — `haversineDistance`, coordinate helpers
- `src/shared/utils/index.ts` — barrel export

---

## Phase 4 — Modules: Auth, UserPreferences, Chat, Maps

### Auth (`src/modules/auth/`)
- `AuthContext.tsx` — `AuthProvider` wraps app; `Session` discriminated union (`loading | guest | authenticated`); `useAuth()` hook exposes session, signIn, signUp, signOut, resetPassword, continueAsGuest, error, clearError
- `LoginScreen.tsx` — animated screen with Lottie (`Landmarks.json`), SVG clip-path background (`loginBackground.png`), Reanimated transitions; accepts `onComplete` callback; LOG IN / REGISTER / SKIP buttons
- `index.ts` — exports `AuthProvider`, `useAuth`, `Session`, `LoginScreen`

### UserPreferences (`src/modules/user-preferences/`)
- `types.ts` — `UserPreferences { themeMode: 'light' | 'dark', currency: string }`
- `UserPreferencesContext.tsx` — `UserPreferencesProvider`; persists to AsyncStorage; `useUserPreferences()` returns `{ preferences, isLoaded, setThemeMode, setCurrency }`

### Chat (`src/modules/chat/`)
- `useChat.ts` — manages message history, sends to `ChatCompletionClient`, handles typed errors; returns `{ messages, isTyping, sendMessage }`
- `ChatScreen.tsx` — full chat UI; accepts `client: ChatCompletionClient` and `onClose?`; uses `BSAFE_SYSTEM_PROMPT` for travel safety context; `FlatList` with auto-scroll
- `components/ChatBubble.tsx`, `ChatInput.tsx`, `TypingIndicator.tsx`
- `__tests__/useChat.test.ts`

### Maps (`src/modules/maps/`)
- `types.ts` — `NearbyPlace`, `PlaceCategory`
- `useNearbyPlaces.ts` — accepts `PlacesClient`, loads nearby places by category; `{ places, isLoading, error, refresh }`
- `LocationContext.tsx` — `LocationProvider` wraps expo-location; `useLocation()` returns current coords + permission state
- `__tests__/useNearbyPlaces.test.ts`

---

## Phase 5 — Modules: Regional-Data, Social

### Regional Data (`src/modules/regional-data/`)
- `types.ts` — branded types: `CountryId = string & { __brand: 'CountryId' }`, `CityId`; `Country { id, name, flag, iso2, dialCode }`, `City`
- `data/countries.ts` — 190+ countries with ISO2, dial codes, flags
- `data/cities.ts` — major cities with coordinates
- `lookup.ts` — `lookupCountry(id)`, `lookupCity(id)`, `searchCountries(query)`, `searchCities(query, countryId?)`
- `__tests__/lookup.test.ts`

### Social (`src/modules/social/`)
- `useFriends.ts` — subscribes to friends, incoming/sent requests; CRUD: sendRequest, acceptRequest, declineRequest, removeFriend, blockFriend, searchUsers; `CurrentUser { uid, displayName: string | null, email: string | null }`
- `useGroups.ts` — subscribes to groups + messages per group; CRUD: createGroup, updateGroup, deleteGroup, addMember, removeMember, leaveGroup, sendMessage, getMessages
- `useLocationSharing.ts` — subscribes to shares; manages GPS watch via `ExpoLocationService`; auto-starts/stops position tracking based on active shares; createShare, stopShare, extendShare
- `__tests__/useFriends.test.ts`, `__tests__/useGroups.test.ts`

**React 19 test fix:** Subscription callbacks in tests must be async (`setTimeout(0)`) to avoid "Maximum update depth exceeded". All test files set `(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true`.

---

## Phase 6 — Social Module Tests (React 19 fixes)

**Problem:** `jest-expo` with React 19 caused OOM / infinite re-render when subscription callbacks called `setState` synchronously during effect mount.

**Solution:**
1. Split `jest.config.js` into two projects:
   - `logic` — `testEnvironment: 'node'`, `babel-jest` only (no RN transform chain). Runs all `.test.ts` files.
   - `rn` — `jest-expo` preset. Runs `.test.tsx` files only.
2. Mock subscription callbacks fire asynchronously: `setTimeout(() => cb([]), 0)`
3. Test assertions wrapped in: `await act(async () => { await new Promise(r => setTimeout(r, 10)); })`
4. `getMessages` test in `useGroups` needs 3 chained `act()` flushes (two-level async: groups arrive → re-render → messages effect fires → messages arrive)

---

## Phase 7 — Products: BSafe

### Trips (`src/products/bsafe/trips/`)
- `types.ts` — `Trip`, `Activity` (12 categories), `Booking` (5 types), `DayItinerary`, `TripStatus`, `EventStatus`
- `useTrips.ts` — subscription-based; `currentUser: { uid } | null`; full CRUD + `moveActivity` (delete + re-add with same id); returns `TripsState`
- `tripUtils.ts` — `getTripStatus`, `getDaysUntil`, `calculateDuration`, `formatDateRange`, `formatDate`, `generateDayItinerary`, `getCategoryIcon`, `getBookingIcon`, `calculateTotalPrice`, `calculateDistanceKm`, `estimateDriveDurationMinutes`, `downsamplePolyline`
- `__tests__/useTrips.test.ts`

### Emergency (`src/products/bsafe/emergency/`)
- `types.ts` — `EmergencyContact { id, name, phone, relationship }`, `CountryEmergencyNumbers`
- `useEmergency.ts` — promise-load pattern (not subscription); `cancelled` flag for cleanup; returns contacts + addContact, updateContact, deleteContact, reorderContacts
- `countryEmergencyNumbers.ts` — static data: police/ambulance/fire/tourist police for 50+ countries
- `__tests__/useEmergency.test.ts`

### Travel Tools (`src/products/bsafe/travel-tools/`)
- `types.ts` — `TravelDocument` (7 document types), `PackingItem`, `PackingCategory`
- `useDocuments.ts` — AsyncStorage key `@be5afe_documents`; add/update/delete/getDocument/getDocumentsByType; sorted by `createdAt` desc
- `usePackingList.ts` — AsyncStorage key `@be5afe_packing_list`; toggle/template/progress/category filter; `getProgress()` returns `{ packed, total, percentage }`
- `__tests__/usePackingList.test.ts`

### Widgets (`src/products/bsafe/widgets/`)
- `types.ts` — `WidgetType` union (18 types), `WidgetConfig { id, type, order }`, `WIDGET_METADATA` constant (title, description, icon, iconColor per type)
- `useWidgets.ts` — AsyncStorage key `@be5afe_widgets`; default widgets: weather, safety, emergency, alerts; addWidget, removeWidget, reorderWidgets
- `__tests__/useWidgets.test.ts`

### Safety Data (`src/products/bsafe/safety-data/`)
- `countrySafetyRatings.ts` — `CountrySafety { overallSafety: 1-5, categories: { crime, health, transport, natural, political, terrorism }, description, commonRisks, safestAreas, areasToAvoid, bestTimeToVisit }` for 32 countries
- `countryScams.ts` — scams by country: `{ title, description, prevention, severity: high|medium|low }`; covers SE Asia, Europe, Americas, Middle East, Africa

---

## Phase 8 — App Entry Point: Navigation + Providers

### AppContext (`src/app/AppContext.tsx`)
- Single DI hub; `AppContextValue` derives all state types via `ReturnType<typeof hook>`
- Exposes: `auth`, `location`, `trips`, `emergency`, `friends`, `groups`, `widgets`, `travelTools`, `locationSharing`
- `TravelToolsContext` merges `useDocuments` + `usePackingList` state
- `useAppContext()` throws if used outside provider

### AppProviders (`src/app/AppProviders.tsx`)
- Singletons at module level: `authRepo`, `tripsRepo`, `emergencyRepo`, `friendsRepo`, `groupsRepo`, `locationSharingRepo`, `gpsService`
- `InnerProviders` component: calls all hooks, builds `AppContextValue`, renders `ThemeProvider` → `AppContextProvider`
- Provider tree: `GestureHandlerRootView` → `SafeAreaProvider` → `AuthProvider` → `UserPreferencesProvider` → `InnerProviders`

### Navigation (`src/app/navigation/`)
- `types.ts` — `RootStackParamList` (29 routes) + `BottomTabParamList` (5 tabs)
- `BottomTabNavigator.tsx` — 5 tabs: Home, Guides, Map, MyTrips, Settings; custom bump-circle active indicator; Ionicons tab icons
- `RootNavigator.tsx` — auth gate: `loading` → dark splash + ActivityIndicator; `!authed` → `LoginScreen`; authed → `NavigationContainer` + `Stack.Navigator`; `useEffect` sets `authed=true` when Firebase restores session

### Initial Screens (Phase 8)
- `HomeScreen.tsx` — LinearGradient background; 12-tile quick-action grid; each tile has explicit `navigate` function (avoids `as never` type escape for routing)
- `ProfileScreen.tsx` — shows user info + sign out (authenticated) or "Browsing as guest" message (guest)
- `EmergencyScreen.tsx` — country emergency numbers lookup + personal emergency contacts list with call/delete
- `ScamAlertsScreen.tsx` — searchable scam list with severity badges
- `TripsScreen.tsx` — sorted trip list (active → upcoming → past) with countdown
- `TripDetailsScreen.tsx` — day-by-day itinerary with activity cards
- `FriendsScreen.tsx` — friends list with incoming request badge
- `GroupsScreen.tsx` — groups list
- `WidgetsScreen.tsx` — widget dashboard with remove confirmation

---

## Phase 9 — Screens: Travel Tools + Social Details + Chat

### New Screens
- `DocumentsScreen.tsx` — add/view/delete travel documents; expiry warning (red = expired, orange = <30 days); type chips (passport, visa, insurance, etc.); inline `AddDocModal` (pageSheet)
- `PackingListScreen.tsx` — checklist with progress bar; category filter chips; unpacked items shown first; starter template loader; `AddItemModal`
- `GroupDetailsScreen.tsx` — group chat UI; own/other message bubbles; send input with keyboard avoidance; empty state
- `CurrencyConverterScreen.tsx` — 20-currency converter; dropdown pickers; swap button; rate table for top 10 vs selected base
- `ChatAppScreen.tsx` — thin wrapper: instantiates `MockChatClient`, renders `ChatScreen` with back nav `onClose`

### AppContext / AppProviders additions
- `travelTools` key added merging `useDocuments` + `usePackingList` into single context object
- `useDocuments` and `usePackingList` added to `InnerProviders`

---

## Phase 10 — Screens: Country Safety + Guides + Medical Card

### New Screens
- `CountrySafetyScreen.tsx` — searchable list of 32 countries sorted by safety score; color-coded badges (green ≥4.5, amber ≥3.5, red <3.5); navigates to `CountryDetails`
- `CountryDetailsScreen.tsx` — full country page: overall score badge, animated `ScoreBar` for 6 categories, common risks, safe areas, avoid areas, scam list with severity badges
- `LocalLawsScreen.tsx` — country search; detailed laws + customs for Thailand, Japan, Singapore, UAE, India; generic fallback for other countries; sections: Must Know, Local Customs, categorised rules
- `EmergencyMedicalCardScreen.tsx` — editable card; blood type chip picker, allergies, conditions, medications, emergency notes, doctor info, organ donor toggle; persisted to AsyncStorage `@be5afe_medical_card`; inline edit/save/cancel header actions
- `GuidesScreen.tsx` (replaced stub) — 3-tab layout: Safety (country list → CountryDetails), Scams (all scams cross-country, filterable), Tips (10 essential travel safety tips with icons)

---

## Phase 11 — Auth Gate + Runtime Bug Fixes

### Auth wiring
- `RootNavigator.tsx` reads `session` from `useAuth()` (available because it's inside `AuthProvider`)
- Three states: `loading` (dark splash), `!authed` (LoginScreen), `authed` (main NavigationContainer)
- `authed` state: local `useState(false)`, set to `true` by `LoginScreen.onComplete` (skip or successful auth) or by `useEffect` when Firebase restores a persisted session (`session.kind === 'authenticated'`)
- Sign-out flow: Firebase `signOut()` → `onAuthStateChanged` fires with null → session becomes `guest` → next cold launch shows LoginScreen

### ProfileScreen
- Authenticated: shows displayName, email, sign-out button
- Guest: shows "Browsing as guest" with contextual message about benefits of signing in

### Runtime bug fixes (pre-phase-11 audit)

**1. `expo-font` missing**
- `@expo/vector-icons` peer dep wasn't installed; icons crashed on first render
- Fix: `npm install expo-font`

**2. Duplicate Firestore initialisation**
- `FirebaseAuthRepository` called `getFirestore(firebaseApp)` directly; `@infra/database/firestore` calls `initializeFirestore` with Android long-polling settings
- On Android: `initializeFirestore` can only be called once — calling `getFirestore` before it throws "Firestore has already been started"
- Fix: `FirebaseAuthRepository` imports shared `db` from `@infra/database/firestore`

**3. `Trips` route unregistered**
- `HomeScreen` navigated to `'Trips'` which existed in `RootStackParamList` but had no registered `Stack.Screen`
- Fix: removed `Trips` from type; refactored `QUICK_ACTIONS` to use per-tile `navigate` functions; "My Trips" tile now calls `navigation.navigate('HomeTabs', { screen: 'MyTrips' })`

**4. Architecture violation: infra → products**
- `FirestoreTripsRepository` imported `generateDayItinerary` from `@products/bsafe/trips/tripUtils`
- Fix: inlined the 7-line function directly into the infra file

**5. `useLocationSharing` not wired**
- Hook, contract, and Firestore repo existed but were never instantiated in `AppProviders`
- Fix: added `locationSharingRepo`, `gpsService` singletons; `useLocationSharing` called in `InnerProviders`; exposed as `locationSharing` on `AppContextValue`

---

## Infra Layer Summary

| Repository | File | Backing store | Contract |
|---|---|---|---|
| `FirebaseAuthRepository` | `infra/auth/firebase/` | Firebase Auth + Firestore (user profile) | `AuthRepository` |
| `FirestoreTripsRepository` | `infra/trips/firestore/` | Firestore `users/{uid}/trips` subcollection | `TripsRepository` |
| `AsyncStorageEmergencyRepository` | `infra/emergency/asyncstorage/` | AsyncStorage `@be5afe_emergency_contacts` | `EmergencyRepository` |
| `FirestoreFriendsRepository` | `infra/social/firestore/` | Firestore `friendships`, `friendRequests` | `FriendsRepository` |
| `FirestoreGroupsRepository` | `infra/social/firestore/` | Firestore `groups`, `messages` subcollection | `GroupsRepository` |
| `FirestoreLocationSharingRepository` | `infra/social/firestore/` | Firestore `locationShares` | `LocationSharingRepository` |
| `ExpoLocationService` | `infra/location/expo/` | `expo-location` | (direct, used by `useLocationSharing`) |
| `FirestoreLocationRepository` | `infra/location/firestore/` | Firestore | `LocationRepository` |
| `GeminiClient` | `infra/ai/gemini/` | Gemini 2.5 Flash API | `ChatCompletionClient` |
| `MockChatClient` | `infra/ai/gemini/` | In-memory pattern matching | `ChatCompletionClient` |
| `GooglePlacesClient` | `infra/places/google/` | Google Places API | `PlacesClient` |
| `MockPlacesClient` | `infra/places/google/` | In-memory fixtures | `PlacesClient` |

**Shared infra patterns:**
- `strip<T>(obj)` — JSON round-trip before Firestore writes to remove `undefined` values
- `newId()` — `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
- `serverTimestamp()` used for all cloud-written timestamps; ISO strings for local state
- Android Firestore: `initializeFirestore(app, { experimentalForceLongPolling: true })` to avoid WebChannel issues
- Firebase config: `EXPO_PUBLIC_FIREBASE_*` env vars; graceful warn if missing (won't crash on boot)

---

## Test Infrastructure

**`jest.config.js`** — two projects to avoid OOM with jest-expo:
- `logic` — `testEnvironment: 'node'`, `babel-jest` with `babel-preset-expo`. Matches `**/*.test.ts`. Used for all hook/logic tests.
- `rn` — `jest-expo` preset. Matches `**/*.test.tsx`. For component tests (none yet).

**Test count:** 72 tests across 12 suites, all passing.

**Tested:** useTrips, useEmergency, useFriends, useGroups, usePackingList, useDocuments, useWidgets, useChat, useNearbyPlaces, useLocationSharing, regional-data lookup, smoke

**Fix applied in Phase 17:** `useLocationSharing` used `await import('expo-location')` dynamically inside an effect — Jest's node environment can't handle dynamic imports. Converted to a static import at the top of the module; `jest.mock('expo-location', ...)` in the test then intercepts it correctly.

**Not tested:** all infra repos, all screens, all context providers

---

## Remaining Placeholders (need external APIs)

| Route | Blocker |
|---|---|
| `ReportIncident` | Backend / moderation API |
| `LocationSharing` | Real-time map rendering |
| `NearestHospital` | Google Places API + map |
| `TouristSpots` | Google Places API + map |
| `Places` | Google Places API + map |
| `ESim` | Carrier/eSIM provider API |
| `Insurance` | Insurance partner API |
| `HealthGuide` | Content CMS or Firebase data |
| `LocalApps` | Curated static content or CMS |
| `Weather` | Weather API (OpenWeather etc.) |
| `MapScreen` (tab) | Map SDK (Mapbox / Google Maps RN) |

---

## Phase 12 — Add/Edit Trip Flow

### New Files
- `src/app/screens/trips/AddTripModal.tsx` — pageSheet modal; fields: destination*, country*, startDate* (YYYY-MM-DD), endDate* (YYYY-MM-DD), notes; validates regex + `Date` parse + end ≥ start; reusable local `Field` component
- `src/app/screens/trips/AddActivityModal.tsx` — title*, time*, 12-category chip picker (horizontal `ScrollView`), location, price (decimal), notes; calls `trips.addActivity(tripId, dayDate, activity)`
- `src/app/screens/trips/AddBookingModal.tsx` — 5-type selector (flight/hotel/car/tour/other), title*, confirmation number, date (YYYY-MM-DD), price, notes; calls `trips.addBooking(tripId, booking)`

### Rewrites
- `TripDetailsScreen.tsx` — itinerary/bookings tab bar; per-day "+" button opens `AddActivityModal` for that day; activities show icon, title, location, price, time; long-press to delete (Alert confirm); bookings tab: "Add booking" dashed button + list with status badges (confirmed = green, planning = yellow); long-press to delete; delete trip via trash icon in header (Alert confirm + `navigation.goBack()`)
- `TripsScreen.tsx` — "+" button in header + empty-state CTA both open `AddTripModal`; `AddTripModal` wired to `trips.addTrip`

---

## Phase 12a — Firebase Dev Setup ✅

### What was done

**Files created/modified:**

| File | What |
|---|---|
| `.env` | Created from `.env.example`; values empty — fill with Firebase console credentials |
| `.env.example` | Unchanged — template with all `EXPO_PUBLIC_FIREBASE_*` keys |
| `firebase.json` | Firebase CLI project config; points at `firestore.rules` + `firestore.indexes.json` |
| `firestore.rules` | Dev-appropriate security rules (see below) |
| `firestore.indexes.json` | Composite indexes for `friendRequests` (toUserId+status) and `messages` (createdAt desc) |
| `.firebaserc` | Project alias file; set `default` to your Firebase project ID |
| `app.json` | Added `bundleIdentifier: com.be5afe.app` (iOS) and `package: com.be5afe.app` (Android) |
| `.gitignore` | Added `.env`, `.env.*`, `.firebaserc`, `google-services.json`, `GoogleService-Info.plist` |

**Note on native Firebase files:** App uses the JS Firebase SDK (`firebase` npm package), not `@react-native-firebase`. `GoogleService-Info.plist` / `google-services.json` are only required for the native SDK — they are **not needed** here. All config is passed via `EXPO_PUBLIC_FIREBASE_*` env vars at runtime.

### Firestore Security Rules (dev)

```
users/{uid}                  — owner-only (auth.uid == uid)
users/{uid}/trips/{tripId}   — owner-only
users/{uid}/friends/{id}     — owner-only
users/{uid}/sharedLocation/  — owner-only
friendRequests/{docId}       — any authenticated user
groups/{groupId}             — any authenticated user
groups/{groupId}/messages/   — any authenticated user
countries, scams, healthGuides, alerts  — public read, no client write
```

Groups/friendRequests are open to all authenticated users for dev; tighten to member-check rules in Phase 18.

### Firestore Collection Map

| Collection path | Created by | Used by |
|---|---|---|
| `users/{uid}` | `FirebaseAuthRepository.signUp` | Auth |
| `users/{uid}/trips/{tripId}` | `FirestoreTripsRepository.addTrip` | Trips |
| `users/{uid}/friends/{id}` | `FirestoreFriendsRepository.acceptRequest` | Friends |
| `users/{uid}/sharedLocation/{id}` | `FirestoreLocationSharingRepository` | Location |
| `friendRequests/{docId}` | `FirestoreFriendsRepository.sendRequest` | Friends |
| `groups/{groupId}` | `FirestoreGroupsRepository.createGroup` | Groups |
| `groups/{groupId}/messages/{msgId}` | `FirestoreGroupsRepository.sendMessage` | Groups |

All collections are created automatically on first write — no manual setup in console needed.

### Status: credentials sourced from original `bsafe/` project ✅

The Firebase project `be5safe` was already set up in the original codebase at `/Users/rm/code/bsafe/`. Credentials copied directly — no manual Firebase console steps needed.

`.env` is populated with all `EXPO_PUBLIC_FIREBASE_*` values plus Gemini and Google Places keys.

**Still needed (one-off, when convenient):**
```bash
! firebase login                          # authenticate CLI
! firebase deploy --only firestore        # push new rules + indexes from this repo
```
The existing `be5safe` Firestore rules are functional but were written for the old schema. The new `firestore.rules` in this repo more precisely matches the new collection structure — deploy when you next have CLI access.

### Key infra files (already wired, no changes needed)

| File | Role |
|---|---|
| `src/infra/auth/firebase/firebaseApp.ts` | `initializeApp` with env vars; singleton via `getApps()` guard |
| `src/infra/database/firestore/index.ts` | `initializeFirestore` with Android long-polling; exports `db` |
| `src/infra/auth/firebase/FirebaseAuthRepository.ts` | Email/password auth + user profile doc |
| `src/infra/trips/firestore/FirestoreTripsRepository.ts` | Full trips CRUD + real-time subscription |
| `src/infra/social/firestore/` | Friends, groups, location sharing repos |

---

## Phases Remaining

| Phase | Scope | Blocker |
|---|---|---|
| ~~**13**~~ | ✅ Global data migration complete — 32 countries + 54 scams seeded into Firestore `countries` + `scams` collections | — |
| ~~**14**~~ | ✅ Map tab complete — see Phase 14 section below | — |
| ~~**15**~~ | ✅ Weather screen — OpenMeteo (no API key), GPS auto-locate, 7-day forecast | — |
| ~~**16**~~ | ✅ HealthGuide + LocalApps — fully built, static curated content | — |
| ~~**17**~~ | ✅ `useDocuments` + `useLocationSharing` tests complete (72 tests, 12 suites) | — |

## Phase 16 — Health Guide + Local Apps ✅

### `HealthGuideScreen.tsx`
- Two-tab toggle: **General** (accordion sections) and **Destinations** (country-by-country cards with search)
- **General tab** — 5 expandable accordion sections:
  - Food & Water Safety (4 items)
  - Mosquito-Borne Diseases (dengue, malaria, Zika, repellent tips)
  - Travel Medical Kit (medications, wound care, prescriptions, high-risk extras)
  - Finding Medical Care Abroad (preparation, emergencies, pharmacies, payment)
  - Altitude & Environmental Risks (AMS, heat, sun, cold)
- **Destinations tab** — 15 countries with searchable accordion cards:
  - Risk level badge (LOW / MEDIUM / HIGH risk, colour-coded)
  - Vaccination list with required vs recommended distinction; red dot = required, blue = recommended
  - Country-specific health tips (dengue, water, altitude, wildlife, etc.)
  - Countries: Thailand, Indonesia, Vietnam, India, Kenya, Egypt, Mexico, Brazil, Japan, UK, USA, France, Australia, UAE, Philippines
- Added **Health Guide** tile to `HomeScreen` grid
- `HealthGuide` route: was `PlaceholderScreen`, now `HealthGuideScreen`

### `LocalAppsScreen.tsx`
- Curated list of essential travel apps grouped into 6 categories with filter chips
- **Categories:** Navigation (4 apps), Communication (4 apps), Safety (4 apps), Transport (4 apps), Money (4 apps), Accommodation (3 apps)
- Each app card shows: icon, name, FREE/PAID badge, tagline, description, platform badges (iOS/Android)
- Pro tips (amber highlight) on ~half the apps — practical advice specific to that app
- Category filter chips scroll horizontally; selecting one filters to that category only
- No external dependencies — fully static, works offline
- Added **Local Apps** tile to `HomeScreen` grid
- `LocalApps` route: was `PlaceholderScreen`, now `LocalAppsScreen`

---

## Phase 15 — Weather Screen ✅

**`WeatherScreen.tsx`**
- No API key needed — uses [Open-Meteo](https://open-meteo.com/) (free, open-source)
- Auto-locates on mount via `ExpoLocationService.getCurrentPosition()` + `reverseGeocode()` for city name
- Current conditions hero card: large temperature, WMO weather condition label, feels-like / humidity / wind stats row
- 7-day forecast list: icon, description, precip (mm if >0), high/low temps
- Pull-to-refresh; retry on error; `RefreshControl` wired
- WMO weather code → label + Ionicon + colour mapped in `describeWeather()`
- Added **Weather** tile to `HomeScreen` quick actions grid
- `Weather` route: was `PlaceholderScreen`, now `WeatherScreen`

---

## Phase 14 — Map Tab ✅

### SDK
Uses `react-native-maps` (already installed). `PROVIDER_GOOGLE` on Android, default Apple Maps on iOS. Google Places API key from `.env` (`EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`).

### Screens

**`MapScreen.tsx`** (Map tab)
- Full-screen `MapView` with user location dot
- 5 category filter chips overlaid top: Hospital, Police, Pharmacy, Food, ATM
- Locate Me button (bottom-right) — calls `ExpoLocationService.getCurrentPosition()`, centres map, fires Places query
- Place pins coloured per category; tap shows `Callout` with name, address, distance
- Horizontal scrollable cards panel at bottom — tap a card to fly the map to that pin
- Stateless: `GooglePlacesClient` and `ExpoLocationService` instantiated as module-level singletons (no context needed)

**`NearestHospitalScreen.tsx`** (from HomeScreen Hospital tile + route)
- Same map pattern, pre-filtered to `hospital` category, limit 15
- Numbered list panel below map (not horizontal cards) — sorted by distance
- Phone call button if `phoneNumber` is returned by Places API
- Semi-transparent branded header overlaid on map

**`SafeZonesScreen.tsx`** (from HomeScreen Safe Zones tile)
- Shows both `police` (blue pins) and `embassy` (purple pins) simultaneously
- Colour legend in header overlay
- Horizontal card scroll panel at bottom

### Navigation
- `NearestHospital` route: was `PlaceholderScreen`, now `NearestHospitalScreen`
- `SafeZones` route: was stub, now full map screen
- `MapScreen`: already wired as bottom tab — now functional

### Remaining map placeholders
- `TouristSpots` — could use `tourist_attraction` Places type; not yet wired
- `Places` — generic category search; not yet wired

---

## Phase 18 — Production Hardening ✅

### Error Boundary
- `src/app/ErrorBoundary.tsx` — React class component; catches any render-phase exception in the tree below it; shows "Something went wrong" screen with the error message and a "Try again" button that resets state
- Wraps the entire `AppProviders` tree as the outermost layer — catches crashes from any provider, navigator, or screen

### Loading States
- `src/app/components/LoadingSpinner.tsx` — shared `ActivityIndicator` centered on `colors.background`; used as an early-return guard in Firestore-backed screens
- `TripsScreen` — returns `<LoadingSpinner />` while `trips.isLoading`
- `FriendsScreen` — returns `<LoadingSpinner />` while `friends.isLoading`
- `GroupsScreen` — returns `<LoadingSpinner />` while `groups.isLoading`

### Deferred (need external accounts)
- **Sentry** — crash reporting; requires Sentry project + `@sentry/react-native` install
- **Analytics** — requires Firebase Analytics or Amplitude account
- **Offline banner** — requires `expo-network` install (`npx expo install expo-network`); straightforward to add once installed
- **Firestore rules deploy** — run `! firebase login && firebase deploy --only firestore` to push `firestore.rules` + `firestore.indexes.json` to the `be5safe` project
| ~~**18**~~ | ✅ Production hardening complete (see Phase 18 section below) | — |
| **19** | App Store build — EAS build config, icons, splash, metadata | Apple/Google dev accounts |

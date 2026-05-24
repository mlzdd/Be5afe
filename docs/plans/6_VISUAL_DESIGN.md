# Be5afe — Visual Design & UX Plan

Last updated: 2026-05-24 (theme system + component inventory + UI library plan + feature backlog + cross-repo audit added)

---

## Purpose

This document tracks the visual design direction and UX decisions for the Be5afe app. It covers what we want each screen to look and feel like, what was lost in the modular rebuild that is worth recovering, and what was intentionally left behind because the legacy version was poor.

The principle: **keep all the UX flows and functionality, rebuild the visuals to be clean and modern rather than the cramped, over-styled look of the legacy app.**

---

## Theme system

All theme tokens live in `src/shared/theme/`. Screens import from `@shared/theme`.

### Brand palette

The app's brand is **deep forest green** with **muted teal/sage** accents. All other colours are neutral.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `brandDark` | `#013220` | `#013220` | Headers, tab bar, primary buttons, nav bars |
| `brandLight` | `#badcdb` | `#badcdb` | Gradient backgrounds, light tints |
| `accent` | `#99c9c9` | `#99c9c9` | Borders, focus rings, input highlights |
| `accentLight` | `#bfe1d7` | `#bfe1d7` | Active tab indicator, selected states |
| `accentDark` | `#0b2e23` | `#0b2e23` | Pressed states, dark overlays |

### Light vs dark surfaces

| Token | Light | Dark |
|---|---|---|
| `background` | `#ffffff` | `#121212` |
| `card` / `cardBackground` | `#ffffff` | `#1E1E1E` |
| `textPrimary` | `#000000` | `#FFFFFF` |
| `textSecondary` | `#666666` | `#B0B0B0` |
| `textTertiary` | `#999999` | `#808080` |
| `textInverse` | `#ffffff` | `#000000` |
| `inputBackground` | `#F5F5F5` | `#2C2C2C` |
| `border` / `separator` | `#e6e6e6` | `#333333` |

Both `colors` (light) and `darkColors` (dark) are fully defined. `ThemeProvider` resolves `'system'` to the device setting. The user's `themeMode` preference (`'light' | 'dark' | 'system'`) is persisted in `UserPreferencesContext`.

### Status / semantic colours (same in both modes)

| Token | Value | Usage |
|---|---|---|
| `success` | `#4CAF50` | Confirmed, safe, completed |
| `error` | `#F44336` | Errors, delete, high-risk |
| `warning` | `#FF9800` | Caution, medium-risk |
| `info` | `#2196F3` | Informational |
| `safetyHigh` | `#4CAF50` | Country safety score high |
| `safetyMedium` | `#FFC107` | Country safety score medium |
| `safetyLow` | `#FF5722` | Country safety score low |

### Typography scale

| Variant | Size | Weight | Usage |
|---|---|---|---|
| `brand` | 36px / extrabold | App name only |
| `h1` | 32px / bold | Screen titles |
| `h2` | 28px / bold | Major section headers |
| `h3` | 24px / semibold | Card headers |
| `h4` | 20px / semibold | List item titles, prominent labels |
| `body` | 16px / normal | Paragraph text |
| `bodyLarge` | 18px / normal | Prominent body copy |
| `bodySmall` | 14px / normal | Secondary / supporting text |
| `caption` | 12px / normal | Timestamps, meta info |
| `button` | 16px / semibold | Button labels |
| `label` | 12px / medium | Form labels, chips, tags |

### Spacing scale

`xs:4 · sm:8 · md:12 · base:16 · lg:20 · xl:24 · 2xl:32 · 3xl:40 · 4xl:48 · 5xl:64`

Shorthand: `screenPadding:16` · `cardPadding:12` · `sectionSpacing:24`

### Border radius

`sm:4 · md:8 · lg:12 · xl:16 · 2xl:20 · full:9999`

- Cards: `lg` (12) or `xl` (16)
- Chips / pills / badges: `full` (9999)
- Inputs: `md` (8)
- Bottom sheets: `xl` (16) on top corners only

### Shadows

| Key | Elevation | Usage |
|---|---|---|
| `sm` | 1 | Subtle list cards |
| `md` | 2 | Floating cards, tile grid |
| `lg` | 4 | Modals, dropdown overlays |
| `xl` | 6 | Bottom sheets |

### How to consume the theme in components

**Current gap:** all existing screens import `colors` directly — the hardcoded light object. Dark mode is not yet active in any screen. All new components and all screens touched during Phases 19–22 must use `useTheme()` instead.

`useTheme()` already exists at `src/shared/hooks/useTheme.ts` — do NOT create a `useColors()` hook.

```typescript
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography, radius, shadows } from '@shared/theme';

export function MyComponent() {
  const colors = useTheme(); // resolves to light or dark palette automatically
}
```

`spacing`, `typography`, `radius`, `shadows`, and `animations` are scheme-independent — import them directly as constants, no hook needed.

---

## Existing component and service inventory

**Read this before building anything.** These are already built and working. Do not rewrite them — use them.

---

### Theme

**`useTheme()` — `src/shared/hooks/useTheme.ts`**
Returns the full `Colors` object for the active scheme (light or dark). Use this in every component instead of importing `colors` directly.

```typescript
import { useTheme } from '@shared/hooks/useTheme';
const colors = useTheme(); // resolves to light or dark palette automatically
```

`spacing`, `typography`, `radius`, `shadows`, `animations` are scheme-independent — import as constants directly from `@shared/theme`.

---

### Location & regional data

**`LocationContext` — `src/modules/maps/LocationContext.tsx`**
Full location provider. Handles: load saved preference from `LocationRepository`, GPS auto-detect via `ExpoLocationService`, reverse geocode to country/city, `setLocation(countryId, cityId)` to update and persist. Exports `useLocation()` hook.

```typescript
const { location, isLoading, setLocation } = useLocation();
// location: { countryId, cityId, coordinates: { lat, lng } } | null
```

Not yet wired into `AppProviders` — that is Phase 19 work. But the context itself is complete and tested.

**`ExpoLocationService` — `src/infra/location/expo/ExpoLocationService.ts`**
- `requestPermission()` → `Promise<boolean>`
- `getCurrentPosition()` → `Promise<LatLng | null>` (requests permission automatically)
- `reverseGeocode(coords)` → `Promise<{ city, country, isoCountryCode } | null>`

**Regional data — `src/modules/regional-data/`**
Full country + city dataset with pre-built indexes. All lookups are synchronous (built at module load).

```typescript
import {
  getAllCountries,          // Country[] — full list, sorted by name in data file
  getCountryById,           // (id: CountryId) => Country | undefined
  getCountryByIso2,         // ('TH') => Country | undefined
  getCountryByName,         // ('Thailand') => Country | undefined
  getCitiesForCountry,      // (countryId) => City[]
  getCityById,              // (id: CityId) => City | undefined
  searchCountries,          // (query: string) => Country[] — filters by name or iso2
  searchCities,             // (query: string, countryId?) => City[] — filters by name
} from '@modules/regional-data';
```

`Country` has: `id` (ISO alpha-2 lowercase as `CountryId`), `name`, `flag` (emoji), `iso2`, `dialCode`.
`City` has: `id` (`{countryId}-{slug}` as `CityId`), `name`, `countryId`, `coordinates?: { lat, lng }`.

**`regionFromCoords()` — `src/modules/maps/types.ts`**
Converts a `LatLng` to a `MapRegion` (the shape `MapView` expects). Second arg is `deltaDeg` (zoom level, default 0.05).

```typescript
import { regionFromCoords } from '@modules/maps/types';
const region = regionFromCoords({ lat: 13.75, lng: 100.5 }, 0.04);
```

---

### Maps

**`useNearbyPlaces()` — `src/modules/maps/useNearbyPlaces.ts`**
Hook that queries the Places API for a given category near a `LatLng`. Auto-fetches when `center` changes.

```typescript
const { places, isLoading, error, refresh } = useNearbyPlaces(
  placesClient,     // PlacesClient instance
  center,           // LatLng | null — null = no fetch
  'hospital',       // PlaceCategory: 'hospital' | 'police' | 'pharmacy' | 'restaurant' | 'atm' | 'embassy'
  { limit: 15 },    // optional PlacesSearchOptions
);
// places: Place[] — each has id, name, address, location: LatLng, category, rating?
```

**Map pattern used in MapScreen / NearestHospitalScreen / SafeZonesScreen:**
```typescript
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
// Always use PROVIDER_GOOGLE on Android:
provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
// showsUserLocation and showsMyLocationButton={false} — we provide our own locate button
```

All three map screens follow the same pattern: `MapView` fills the screen, category filter chips or a locate button sits in a floating `View` overlay on top, a `FlatList` below shows results as cards. Do not diverge from this pattern without good reason.

---

### Chat

**`ChatScreen` — `src/modules/chat/ChatScreen.tsx`**
Self-contained chat UI. Takes a `client: ChatCompletionClient` and `onClose: () => void`. Internally uses `useChat()` hook. Has its own system prompt for travel safety.

```typescript
import { ChatScreen } from '@modules/chat/ChatScreen';
import { GeminiClient } from '@infra/ai/gemini/GeminiClient';
// or MockChatClient for dev/test

<ChatScreen client={client} onClose={() => ...} />
```

`ChatAppScreen` (`src/app/screens/ChatAppScreen.tsx`) is the current wiring — it uses `MockChatClient`. Phase 19 will wrap this in a modal/sheet rather than pushing it as a full screen. When doing so, swap `MockChatClient` for `GeminiClient` and pass the API key from env.

---

### Trip modals

These three modals (`src/app/screens/trips/`) are built and functional. They use `Modal` with `presentationStyle="pageSheet"` (slides up from bottom). **Do not replace these with bottom sheets** — the pageSheet style is intentional for forms that need keyboard avoidance.

**`AddTripModal`** — fields: destination (text), country (text — Phase 21 will upgrade to a picker), startDate (text YYYY-MM-DD — Phase 21 will upgrade to a date picker), endDate, notes. Validates all fields before saving.

**`AddActivityModal`** — fields: title, time (text HH:MM — Phase 21 will upgrade to a time picker), category (tap-to-select grid of 12 options), location, notes, price. Category selector is already a visual grid, not a dropdown.

**`AddBookingModal`** — fields: type (flight/hotel/car/tour/other, tap-to-select), title, confirmation number, date (text YYYY-MM-DD), price, notes.

**Note on date/time inputs:** all date and time fields currently accept raw text (YYYY-MM-DD / HH:MM) with regex validation. Phase 21 replaces these with `@react-native-community/datetimepicker` — check that package is installed before writing any picker code.

---

### User preferences

**`UserPreferencesContext` — `src/modules/user-preferences/UserPreferencesContext.tsx`**
Persists user preferences to `@be5afe_user_preferences` in AsyncStorage. Exports:

```typescript
const { preferences, setThemeMode, setDisplayCurrency, setLocale } = useUserPreferences();
// preferences: { themeMode: 'light'|'dark'|'system', displayCurrency: Currency, locale: string }
```

`ThemeMode` and `Currency` types are in `src/modules/user-preferences/types.ts`. When Phase 20 adds a default country preference, add it to this context rather than creating a new one.

---

### Content sync

**`ContentSyncService` — `src/infra/sync/ContentSyncService.ts`** (D7)
Called once on app start. Exports:

```typescript
runContentSync()          // call in AppProviders useEffect — fire and forget
getSyncedScamPatterns()   // Promise<Record<string, unknown>[]>
getSyncedAlerts()         // Promise<Record<string, unknown>[]>
getSyncedEmergencyNumbers() // Promise<Record<string, unknown>[]>
BUNDLE_EXPORT_VERSION     // number constant from bundled seed
BUNDLE_SCHEMA_VERSION     // number constant from bundled seed
```

---

### `LoadingSpinner` — `src/app/components/LoadingSpinner.tsx`

Simple full-screen centered spinner. Use this for any screen-level loading state.

```typescript
import { LoadingSpinner } from '../components/LoadingSpinner';
if (isLoading) return <LoadingSpinner />;
```

---

## Shared UI component library

All shared UI primitives live in `src/shared/ui/`. They are scheme-aware (use `useTheme()` internally), have no business logic, and accept children or simple props. Import them from `@shared/ui`.

This library is built as **Phase 19 step 0** — before any screen work begins — so every phase after it builds on consistent foundations rather than inventing its own inline styles.

---

### Dependency: `@gorhom/bottom-sheet`

**Install before Phase 19:**
```bash
npx expo install @gorhom/bottom-sheet
```

Version 5.x. Peer deps already satisfied: `react-native-gesture-handler ≥2.16.1` ✅ (we have ~2.24), `react-native-reanimated ≥3.16.0` ✅ (we have ~3.17). No native modules required beyond what is already installed.

Use `@gorhom/bottom-sheet` for all bottom sheets in the app. Do not build a custom sheet with raw `Animated`/`Reanimated` — Gorhom handles keyboard avoidance, safe area, gesture competition with scroll views, and backdrop dismiss correctly out of the box.

**Standard usage pattern:**
```typescript
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useRef, useCallback } from 'react';

const sheetRef = useRef<BottomSheet>(null);
const snapPoints = ['50%', '90%']; // or fixed: [300, 600]

// open
sheetRef.current?.expand();
// close
sheetRef.current?.close();

<BottomSheet
  ref={sheetRef}
  index={-1}                    // -1 = closed by default
  snapPoints={snapPoints}
  enablePanDownToClose
  backdropComponent={(props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  )}
>
  <BottomSheetView>
    {/* content */}
  </BottomSheetView>
</BottomSheet>
```

---

### Components to build — `src/shared/ui/`

#### `Card` — `Card.tsx`

Consistent surface with background, border radius, shadow, and optional padding. Replaces the dozens of inline card `StyleSheet` objects scattered across screens.

```typescript
<Card>                          // default: md padding, lg radius, md shadow
<Card padding="sm">             // padding: 'none' | 'sm' | 'md' | 'lg'
<Card radius="xl">              // radius: 'md' | 'lg' | 'xl' (default 'lg')
<Card shadow="lg">              // shadow: 'none' | 'sm' | 'md' | 'lg' (default 'md')
<Card onPress={fn}>             // makes it a TouchableOpacity
<Card style={overrides}>        // escape hatch
```

Uses `colors.card`, `radius`, `shadows` from theme. Dark mode handled via `useTheme()`.

---

#### `BottomSheetModal` — `BottomSheetModal.tsx`

A thin wrapper around `@gorhom/bottom-sheet` with our standard backdrop, safe area insets, handle bar, and background colour baked in. Keeps sheet usage consistent and means screens don't need to wire up the backdrop and background themselves every time.

```typescript
<BottomSheetModal
  ref={sheetRef}
  snapPoints={['60%']}          // required
  title="Select Location"       // optional — renders a handle + title row
>
  {/* children rendered inside BottomSheetView */}
</BottomSheetModal>
```

---

#### `Chip` — `Chip.tsx`

Small pill-shaped label. Used for trust tier badges (`Confirmed`, `Reported`), alert count on home, category tags, severity indicators.

```typescript
<Chip label="Confirmed" color={colors.success} />
<Chip label="⚠ 3 alerts" color={colors.warning} onPress={fn} />
<Chip label="High" color={colors.error} size="sm" />
// size: 'sm' | 'md' (default 'md')
// onPress makes it tappable with active opacity
```

Renders as a `View` (or `TouchableOpacity` if `onPress` provided) with `borderRadius: radius.full`, small horizontal padding, and a slightly tinted background derived from the `color` prop (`color + '20'` alpha for background, full colour for text/border).

---

#### `SettingsRow` — `SettingsRow.tsx`

A single settings list row. Label on the left, right element is one of: a value string, a `Switch`, or a chevron arrow. Optionally tappable.

```typescript
<SettingsRow label="Dark mode" right={<Switch value={isDark} onValueChange={toggle} />} />
<SettingsRow label="Default country" value="Thailand" onPress={openPicker} />
<SettingsRow label="Emergency medical card" onPress={() => navigate('EmergencyMedicalCard')} />
<SettingsRow label="Version" value="1.0.0" />  // no chevron when onPress absent
```

---

#### `SettingsSection` — `SettingsSection.tsx`

A labelled group of `SettingsRow` items — the `ACCOUNT`, `PREFERENCES` headers in Settings.

```typescript
<SettingsSection title="Preferences">
  <SettingsRow ... />
  <SettingsRow ... />
</SettingsSection>
```

Renders the uppercased section title in `typography.label` + `textSecondary`, then the children separated by `divider`-coloured hairlines.

---

#### `EmptyState` — `EmptyState.tsx`

Consistent empty state used across lists and screens. Replaces the ad-hoc icon + text + optional button pattern that every screen currently writes inline.

```typescript
<EmptyState
  icon="airplane-outline"       // Ionicons name
  title="No trips yet"
  subtitle="Add your first trip to get started"   // optional
  action={{ label: 'Add trip', onPress: fn }}     // optional CTA button
/>
```

Centred layout, icon at 64px in `textTertiary`, title in `typography.h4`, subtitle in `typography.bodySmall` + `textSecondary`, action button in `brandDark`.

---

#### `SectionHeader` — `SectionHeader.tsx`

A row with a title on the left and an optional action link on the right. Used above lists and carousels on Home and elsewhere.

```typescript
<SectionHeader title="Quick actions" />
<SectionHeader title="Active alerts" action={{ label: 'See all', onPress: fn }} />
```

---

### Export barrel

`src/shared/ui/index.ts` exports all of the above so screens can import from one place:

```typescript
import { Card, Chip, BottomSheetModal, SettingsRow, SettingsSection, EmptyState, SectionHeader } from '@shared/ui';
```

---

### Convention: where to put components

| Type | Location | Imported via |
|---|---|---|
| Generic UI primitives (Card, Chip, etc.) | `src/shared/ui/` | `@shared/ui` |
| Feature-specific components (WidgetStrip, MiniMap, AlertCountChip) | `src/app/components/` | relative or `@app/components` |
| Screen-local sub-components (only used in one screen) | inline in the screen file or adjacent file in `screens/` | relative |

Do not put feature-specific components in `src/shared/ui/` — shared UI must have zero business logic and zero app context dependencies.

---

## Design principles

1. **Clean over decorated** — the legacy app had too many cards-within-cards, coloured panels, and competing visual weight. Use whitespace instead.
2. **Context-aware** — the selected country/city should propagate everywhere. A user who selects Thailand should see Thai scam alerts, Thai emergency numbers, Thai weather — without manually switching in each screen.
3. **Fast paths over completeness** — surfaces the most important action for a given context at the top. Don't make users scroll to find the thing they came for.
4. **Dark mode ready** — the theme system supports it; design with both in mind from the start.
5. **No mock data visible to users** — anything that says "Coming soon" or shows placeholder content needs to either be real or be hidden.

---

## Current state vs target — screen by screen

---

### Home screen

**Current state:** gradient header, title text, 15 icon tiles in a 3-column grid. Works as a launcher but gives no context and no value on the screen itself. Country defaults silently to Thailand.

**What the legacy app had that was good:**
- `LocationSelectorCard` — prominent tap-to-change country/city card at the top. Opened a bottom sheet with searchable country + city pickers. On select it updated a global `LocationContext` that all other screens read.
- `MiniMapCard` — small MapView showing the user's current GPS location (non-interactive, tap to open full map tab). Gave immediate visual grounding.
- `AlertsSection` — horizontal scroll carousel of live alerts for the selected country.
- Chat entry point — floating "Ask Be5afe" button that opened the AI chat as a bottom sheet (not a full screen push).
- Widget strip — a horizontal row of the user's pinned widgets, each showing a live value (e.g. weather temp, packing progress %).
- Animated entrance — tiles faded/slid in with staggered delays on focus.

**What the legacy app had that was bad:**
- `SafePicksSection` / `AlertsSection` used mock Post data — fake community content that looked like a social feed. Not keeping this.
- `HelpfulToolsCarousel` — another carousel of tools that duplicated the tile grid. Redundant.
- `ServiceGrid` on top of the quick-action tiles — three different ways to navigate to the same places. Reducing to one grid.
- Too much vertical scroll before reaching any useful content.

**Target design:**

```
┌─────────────────────────────────────────┐
│  [gradient header]                      │
│  Be5afe          [chat bubble icon] →   │  ← AI chat opens as bottom sheet
├─────────────────────────────────────────┤
│  📍 Bangkok, Thailand        chevron >  │  ← LocationSelectorCard (tappable)
├─────────────────────────────────────────┤
│  [Mini map — current GPS location]      │  ← 160px tall, tap → Map tab
│  [  Marker at user position  ]          │
├─────────────────────────────────────────┤
│  ⚠ 3 active alerts for Thailand   →   │  ← alert count chip, tap → LiveAlerts
├─────────────────────────────────────────┤
│  [Widget strip — horizontal scroll]     │  ← user's pinned widgets, live values
│  [Weather 29°] [Packing 4/12] [...]    │
├─────────────────────────────────────────┤
│  Quick actions                          │
│  [Emergency] [Scam Alerts] [Safe Zones] │
│  [Hospital]  [Guides]      [Currency]   │
│  [Packing]   [Documents]   [Weather]   │
│  [Friends]   [Groups]      [Local Apps] │
│  [My Trips]  [Report Scam] [Chat]      │
└─────────────────────────────────────────┘
```

**Key decisions:**
- Location selector is the first interactive element after the header — sets context for the whole session.
- Mini map uses the user's GPS if granted, otherwise the selected country's capital coordinates.
- Alert count chip is context-aware (selected country). Hidden if zero active alerts.
- Widget strip is empty with an "Add widget +" button if no widgets configured.
- Chat accessible from the header icon (always) and from the tile grid.
- Quick action tile grid reduced to 15 items max — same as now but with "Report Scam" added as a tile (currently only reachable from ScamAlerts screen).
- Animated staggered entrance for tiles when screen mounts or re-focuses.

---

### My Trips

**Current state:** list of trip cards → TripDetails with itinerary/bookings tabs. Structurally correct. Missing visual richness and UX polish.

**What the legacy app had that was good:**
- **Calendar tab** on TripsScreen — `react-native-calendars` view showing all trips as date ranges with dots for days that have activities. Tap a date to see what's planned.
- **TripMapSection** in TripDetails — MapView showing activity pins for the current day or full trip. Polylines connecting activities in sequence. Toggle between "today's route" and "full trip" view. Tap pin to highlight the activity in the list below.
- **TripInfoCard** — summary row: date range, duration, days-until countdown, total trip cost (summed from activities + bookings).
- **Country flag** on trip cards — `getCountryFlag()` utility, displayed alongside destination name.
- **Cost tracking** — activities and bookings each have an optional price field; trip shows total cost.
- **Activity categories** — rich set: flight, train, bus, ship, drive, car-rental, hotel, restaurant, tour, shopping, sightseeing, other — each with a colour. Currently we only have a subset.
- `moveActivity` — drag to reorder activities within a day.

**What was bad:**
- The add/edit forms were full-screen modal replacements rather than bottom sheets — jarring navigation.
- No date/time picker — times were free text inputs.
- Trip form didn't support adding a country separately from the destination text (needed for flag lookup and Firestore scoping).

**Target design:**

**TripsScreen:**
```
┌─────────────────────────────────────────┐
│  My Trips                          [+]  │
│  [Upcoming] [Past] [All] [Calendar]     │  ← tab row
├─────────────────────────────────────────┤
│  🇹🇭 Bangkok, Thailand                  │
│  12 Jun → 24 Jun · 12 days              │
│  Active now                             │
├─────────────────────────────────────────┤
│  🇯🇵 Tokyo, Japan                       │
│  14 Aug → 22 Aug · 8 days              │
│  47 days away                           │
└─────────────────────────────────────────┘
```

**TripDetails:**
```
┌─────────────────────────────────────────┐
│  ← Bangkok, Thailand  🇹🇭  [edit] [⋮]  │
│  12 Jun – 24 Jun · 12 days              │
│  Total cost: £1,240                     │
├─────────────────────────────────────────┤
│  [mini map: today's activity pins]      │  ← 200px, toggle daily/full trip
│  [polyline connecting pins in order]    │
├─────────────────────────────────────────┤
│  [Itinerary] [Bookings]                 │
│  Day 1 — Mon 12 Jun                     │
│    ✈ Flight BKK  08:00                  │
│    🏨 Check-in Hotel  14:00             │
│    🍜 Dinner  19:30                     │
│  [+ Add activity]                       │
└─────────────────────────────────────────┘
```

**Key decisions:**
- Add proper date/time picker for activities — use `@react-native-community/datetimepicker` (Expo-compatible, no native modules).
- Trip card shows country flag derived from ISO code stored on the trip.
- Activity form is a bottom sheet, not a full-screen modal.
- Map shows on TripDetails by default (collapsed to 200px); user can expand to 340px.
- Calendar tab uses `react-native-calendars` — already a pattern we know works in the codebase context.
- Cost fields are optional on activities and bookings — show total only if at least one cost is entered.

---

### Settings (currently: Profile)

**Current state:** avatar + sign out. Essentially nothing. The tab says "Settings" in the nav but the screen is just a profile page.

**What the legacy app had that was good:**
- **5-tab profile/settings screen:** Personal, Account, Medical, Notifications, Settings.
  - *Personal:* display name, avatar, phone, nationality.
  - *Account:* email, password change, delete account.
  - *Medical:* blood type, allergies, conditions, medications, insurance provider, policy number. (This has now moved to EmergencyMedicalCard screen — better.)
  - *Notifications:* push notification toggles per category.
  - *Settings:* dark mode toggle, default currency, app version.
- Offline cache + pending sync queue for profile edits — saves locally, syncs when reconnected.
- Currency preference that propagated to TripDetails cost display.

**What was bad:**
- The medical tab duplicated the EmergencyMedicalCard screen — don't replicate this.
- Massive single file (35KB) with everything in one component — impossible to maintain.
- Profile photo upload — never actually worked reliably; skip for now.

**Target design — Settings screen as a proper settings page:**

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│  ACCOUNT                                │
│  [avatar] Traveller Name                │
│           traveller@email.com           │
│  Edit profile                    >      │
├─────────────────────────────────────────┤
│  PREFERENCES                            │
│  Default country           Thailand  >  │
│  Default currency            GBP £   >  │
│  Dark mode                   [toggle]   │
├─────────────────────────────────────────┤
│  NOTIFICATIONS (placeholder)            │
│  Scam alerts                 [toggle]   │
│  Live alerts                 [toggle]   │
│  Trip reminders              [toggle]   │
├─────────────────────────────────────────┤
│  PRIVACY & DATA                         │
│  Emergency medical card           >     │  ← link to existing screen
│  Travel documents                 >     │  ← link to existing screen
│  Delete account                   >     │  ← D8 when ready
├─────────────────────────────────────────┤
│  ABOUT                                  │
│  Version 1.0.0                          │
│  Send feedback                    >     │
├─────────────────────────────────────────┤
│  [Sign out]                             │  ← only if authenticated
└─────────────────────────────────────────┘
```

**Key decisions:**
- "Default country" preference seeds the LocationContext on app start — if user has set it, home screen defaults to that rather than Thailand.
- "Default currency" preference used in TripDetails cost display and CurrencyConverter default.
- Dark mode toggle wires to the existing `themeMode` preference already in `UserPreferencesContext`.
- Notification toggles are UI-only for now (stored in preferences, will wire to push when D9 lands).
- Guest users see a reduced settings screen: preferences only, no account section, sign-in prompt.

---

### Guides

**Current state:** destinations tab (country safety ratings + search), scams tab (all scams), tips tab (10 static safety tips). Actually decent — better than the legacy version which had no structure.

**No major changes needed.** Minor polish:
- The destinations tab cards could show a flag icon alongside the country name.
- The scam tab entries could show a "Reported N times" count once D5 data has volume.
- Tips tab is fine as-is.

---

### Map

**Current state:** Google Places API, category filter chips, map markers for nearby places. Works well.

**No major changes needed for now.** Future: add scam report pins as a layer (post-D6, when there's enough data density to be useful).

---

## Feature-specific components still to build

These are app-level components (not generic UI primitives — those are in `src/shared/ui/`). They go in `src/app/components/` and may import from AppContext.

| Component | Phase | Used by | Notes |
|---|---|---|---|
| `LocationSelectorSheet` | 19 | Home, Settings | Wraps `BottomSheetModal` + searchable country/city list from `regional-data`. Calls `setLocation()` on select. |
| `MiniMap` | 19 | Home, TripDetails | Non-interactive MapView 160–200px tall. Single marker or multiple pins. Tap → navigate. |
| `AlertCountChip` | 19 | Home | `Chip` showing count of published alerts for selected country. Hidden if zero. |
| `WidgetStrip` | 19 | Home | Horizontal `FlatList` of mini widget cards. Uses existing widget context data. |
| `CountryFlag` | 20 | Trips, Guides, Settings | Renders `country.flag` emoji in a consistent sized container. Simple — no image loading. |
| `DateTimePicker` | 21 | Trips (activity + booking forms) | Thin wrapper around `@react-native-community/datetimepicker`. Check package is installed before writing. |
| `TripMapSection` | 21 | TripDetails | MapView with activity pins for current day or full trip. Polylines in sequence. Toggle daily/full. |
| `CalendarStrip` | 21 | TripsScreen | `react-native-calendars` view with trip date ranges marked. Check package is installed before writing. |

---

## Implementation phases

> **Read the "Cross-repo audit" section at the bottom before starting any phase.** The audit found significant gaps (hollow widgets, missing profile model, no global currency, missing dialable emergency numbers) that affect scope in Phases 19–22.

Ordered by dependency chain — each phase's foundations are used by the next:

### ✅ Phase 19 step 0 — Shared UI library + bottom sheet install
Complete — `@gorhom/bottom-sheet` is installed and `src/shared/ui/` exports the theme-aware Card, BottomSheetModal, Chip, SettingsRow, SettingsSection, EmptyState, and SectionHeader primitives.

**Do this first, before any screen work. Every subsequent phase depends on these primitives.**

- `npx expo install @gorhom/bottom-sheet` — NOT yet in `package.json`, must be installed
- Confirm `@gorhom/bottom-sheet` peer deps are satisfied: `react-native-gesture-handler ~2.24` ✅ and `react-native-reanimated ~3.17` ✅ already installed
- Build `src/shared/ui/` with these components (all theme-aware, all use `useTheme()` from `@shared/hooks/useTheme`):
  - `Card` — rounded container, optional shadow, optional onPress
  - `BottomSheetModal` — wrapper around `@gorhom/bottom-sheet`, handles `GestureHandlerRootView` requirement, safe area, backdrop
  - `Chip` — pill-shaped label, optional icon, selected/unselected states
  - `SettingsRow` — label + optional value + chevron/switch/icon, used in Settings screen
  - `SettingsSection` — groups SettingsRows with a section title
  - `EmptyState` — icon + title + optional subtitle + optional CTA button
  - `SectionHeader` — bold section label with optional right-side action link
- Export all from `src/shared/ui/index.ts`
- **Do NOT create a `useColors()` hook** — `useTheme()` already exists at `src/shared/hooks/useTheme.ts` and returns the active Colors object. Import it as `import { useTheme } from '@shared/hooks/useTheme'`.
- `npx tsc --noEmit` + `npx jest` must pass before moving to step 1

### Phase 19 — Home screen redesign
- Wire `LocationContext` into `AppProviders` — it exists at `src/modules/maps/LocationContext.tsx` but is NOT currently provided in `AppProviders.tsx`. Add it as a provider wrapping `InnerProviders`.
- `LocationSelectorSheet` — country + city picker as a `BottomSheetModal`, writes to `LocationContext`. First element below the header (Decision V3).
- `MiniMap` card — shows GPS location if permission granted, else the selected country's capital coordinates. Uses `react-native-maps`.
- `AlertCountChip` — filtered count of live alerts for the selected country. Reads from `alerts` in `AppContext`.
- `WidgetStrip` — horizontally scrollable strip of live widget components (see widget component specs below). NOT the same as `WidgetsScreen` — this is the display surface; `WidgetsScreen` is the manager.
- **Widget components to build** (each reads from AppContext, no new data fetching):
  - `WeatherWidget` — current temp + condition icon for selected location
  - `CurrencyWidget` — inline amount input, swap button, live result. Persists last-used currencies to AsyncStorage.
  - `TripCountdownWidget` — days until next upcoming trip (reads from `trips` in AppContext)
  - `PackingProgressWidget` — packed/total items + progress bar (reads from `travelTools.items` in AppContext)
  - `AlertsWidget` — unread alert count, tap → LiveAlerts
  - `EmergencyWidget` — local emergency number for selected country, tap → Emergency screen
- Chat entry in header → opens `ChatAppScreen` in a `BottomSheetModal`. The AI chat currently uses `MockChatClient` — swap to `GeminiClient` from `@infra/ai/gemini/`.
- Animated staggered tile entrance using `react-native-reanimated` (tiles are already on the home screen, just need the animation)

### Phase 20 — Settings screen + UserProfile model
**The audit found the current ProfileScreen is a near-empty stub. This phase is substantially larger than originally scoped.**

- **UserProfile model first** — before touching the UI:
  - Add `UserProfile` type: `{ displayName: string; nationality?: string; homeCountry?: string; phoneNumber?: string }`
  - Store in `users/{uid}/profile` doc (Firestore, auth users) and `@be5afe_profile` (AsyncStorage, guests)
  - Build `useUserProfile` hook, wire into `AppContext`
  - Offline write queue: if save fails (offline), write to `@be5afe_profile_pending`, flush on next successful write attempt

- **Settings screen sections** (use `SettingsSection` + `SettingsRow`):
  - **Personal** — displayName, nationality, homeCountry (text inputs, save button). No profile photo (Decision V8).
  - **Preferences** — default country picker (seeds `LocationContext` on app start, Decision V9), default currency picker (global `appCurrency` wired to currency converter + trip cost display)
  - **Appearance** — dark mode toggle (wired to `themeMode` in `UserPreferencesContext`)
  - **Notifications** — general toggle, critical safety toggle. Store in `UserPreferencesContext`. Not wired to push yet (Decision V7).
  - **Account** — email (read-only), sign out, delete account placeholder (D8 scope)

- **Currency converter** — persist `fromCurrency` / `toCurrency` to AsyncStorage so they survive sessions (Decision V20)

- **Emergency screen** — add `Linking.openURL('tel:${number}')` to each country emergency number row (police, ambulance, fire). Currently display-only — this is a critical UX gap for an emergency safety app.

### Phase 21 — Trips + Documents polish
- Country field on `AddTripModal` upgraded to `LocationSelectorSheet` (country only)
- Country flag shown on trip list cards and `TripDetails` header (use flag emoji from country data)
- Calendar tab added to `TripsScreen` using `react-native-calendars`
- Date fields in `AddTripModal` / `AddBookingModal` upgraded to `DateTimePicker`
- Time field in `AddActivityModal` upgraded to `DateTimePicker` in time mode
- `TripMapSection` added to `TripDetails` (collapsed 200px default, expandable — legacy: `bsafe/src/components/trips/TripMapSection.tsx`)
- Cost field added to `AddActivityModal` (optional number input — already in `AddBookingModal`)
- Total trip cost shown in `TripDetails` header when any cost exists
- **Documents** — upgrade expiry display to "Expires in X days" with colour-coded badge (green >90d, orange 30–90d, red <30d, grey = expired). Replace raw `YYYY-MM-DD` text input with `DateTimePicker`.
- **Safe zones** — add "Directions" (`Linking.openURL('maps://...')`) and "Call" (`Linking.openURL('tel:...')`) action buttons to each police/embassy card (legacy: `bsafe/src/screens/safety/SafeZonesScreen.tsx`)

### Phase 22 — Country context propagation + screen polish
- All location-sensitive screens read from `LocationContext` rather than hardcoded defaults: `ScamAlerts`, `LiveAlerts`, `Emergency`, `Weather`, `CountrySafety`, `HealthGuide`, `LocalLaws`
- Add a subtle "Viewing: Thailand 🇹🇭" indicator row on each of these screens
- Replace hardcoded `countryName = 'Thailand'` default throughout with `location?.countryId ?? null` and a "Select a country" prompt if not set
- **Weather screen** — add travel recommendation card (`getTravelRecommendation` logic — port from `bsafe/src/utils/weatherUtils.ts`), packing suggestions section (`getPackingSuggestions`), UV index label, wind speed label
- **Scam alerts** — add bookmark icon per scam (AsyncStorage: `@be5afe_scam_bookmarks`), Bookmarked filter tab, share button using React Native `Share` API (legacy: `bsafe/src/screens/safety/ScamAlertsScreen.tsx` lines 57–132)
- **Local apps** — add country-specific apps section below the global directory when a country is selected (data source: `bsafe/src/data/countryLocalApps.ts` — import as static supplement)

---

## Decisions log

| # | Decision | Reason |
|---|---|---|
| V1 | Remove SafePicksSection and community post feed | Was mock data; no real content pipeline; not the app's value proposition |
| V2 | Chat is a bottom sheet on Home, not a tab or full-screen push | Lowers the barrier to ask a quick question; full screen is too heavy for a conversational entry |
| V3 | LocationSelectorCard is the first element below the header | Country context is the most important input for the app; it should be impossible to miss |
| V4 | Medical tab moved out of Settings entirely | EmergencyMedicalCard screen already exists and is better; duplication causes confusion |
| V5 | Calendar tab in Trips uses react-native-calendars | Already in legacy codebase patterns; good library; date-range marking is the right UX for multi-day trips |
| V6 | Trip map collapsed by default (200px) | Map is useful context but shouldn't dominate — itinerary is the primary content |
| V7 | Notification toggles stored but not wired yet | UI should exist before push infrastructure; avoids showing empty/broken settings |
| V8 | No profile photo upload | Never worked reliably in legacy; not worth the Firebase Storage complexity pre-launch |
| V9 | Default country in Settings seeds the home screen context | Returning users should not have to re-pick their destination every session |
| V10 | Use `@gorhom/bottom-sheet` v5 for all bottom sheets | Handles keyboard avoidance, safe area, gesture conflict with scroll views correctly; all peer deps already installed (gesture-handler ~2.24, reanimated ~3.17) |
| V11 | Shared UI primitives in `src/shared/ui/`, app-specific components in `src/app/components/` | Shared UI must have zero business logic; mixing them causes circular deps and makes the primitives impossible to test in isolation |
| V12 | UI library built as Phase 19 step 0 before any screen work | Every subsequent phase builds on the same Card/Chip/BottomSheetModal foundations — doing it last means retrofitting and inconsistency |
| V13 | `CountryFlag` renders the flag emoji from `country.flag`, no image loading | Every country in our dataset already has a flag emoji; no Firebase Storage or network dependency needed |
| V14 | eSIM and Insurance screens show curated external links, not mock plan data | Legacy data was entirely fabricated; showing fake prices is worse than a clean directory with real outbound links |
| V15 | Expenses screen is a port priority, not a new feature | 519 lines of working logic in legacy — categories, budget, split — worth recovering before building anything new |
| V16 | Location sharing screen is an immediate port — repo already built | `FirestoreLocationSharingRepository` is complete in the new app; the screen just needs writing |
| V17 | Onboarding and SOS/panic are genuinely new — didn't exist in legacy | Don't look in `/Users/rm/code/bsafe` for these; they need to be designed from scratch |

---

## Feature backlog

Status key: **Port** = existed in legacy, needs porting | **New** = never existed, needs designing | **Decide** = existed as mock data, needs a real vs cut decision

---

### PORT — Location sharing screen
**Legacy:** `bsafe/src/screens/location/LocationSharingScreen.tsx` (292 lines) — fully working.
Had: active shares list with map view showing current location, create share modal (pick recipients from friends, set duration 1h/3h/6h/12h/24h/indefinite, optional message), stop share, extend share duration via action sheet.

**New app status:** `FirestoreLocationSharingRepository` is fully built and wired into `AppProviders`. `LocationSharing` route exists in `RootStackParamList`. Screen is a `PlaceholderScreen`.

**To do:** Write `LocationSharingScreen.tsx`. Use `useLocationSharing` from AppContext. Show active shares on a `MiniMap`, list shares below with stop/extend actions. Create share via `BottomSheetModal` with friend picker and duration selector.

**Legacy reference:** `bsafe/src/screens/location/LocationSharingScreen.tsx`, `bsafe/src/components/location/`

---

### PORT — Expenses + budget tracking
**Legacy:** `bsafe/src/screens/expenses/ExpensesScreen.tsx` (519 lines) + `ExpenseFriendsScreen.tsx` — fully working.
Had: add/edit/delete expenses with categories (food, transport, accommodation, entertainment, health, shopping, other), budget card showing spent vs budget with progress bar, category filter chips, total in selected currency, split expenses with named friends at configurable percentages, personal vs group mode toggle.

**New app status:** `expense-summary` widget type exists in `WIDGET_METADATA` but there is no expenses screen, no expenses context, no data model. Completely absent.

**To do:** Port the expenses feature. Needs: `Expense` type + `ExpensesContext` (AsyncStorage-backed for now, Firestore later), `ExpensesScreen`, budget card component, category breakdown. Trip-linked expenses (show trip total from activity/booking prices) already partially exist in `TripDetails` — the standalone expenses tracker is separate for day-to-day spending.

**Legacy reference:** `bsafe/src/screens/expenses/`, `bsafe/src/contexts/ExpensesContext.tsx`, `bsafe/src/components/expenses/`, `bsafe/src/utils/expenseUtils.ts`

---

### PORT — Tourist spots safety
**Legacy:** `bsafe/src/screens/tourist/TouristSpotsScreen.tsx` (211 lines) — working but static data.
Had: searchable grid of high-risk tourist spots with risk level (medium/high), common issues list, safety tips per spot, location (city/country). Filtered by risk level.

**New app status:** `TouristSpots` route exists in navigation but is a `PlaceholderScreen`.

**To do:** Port the screen. The static data in `bsafe/src/data/touristSpotsData.ts` is usable as a seed. Long-term this feeds from Firestore `scamPatterns` filtered by locality — but static data is fine for launch.

**Legacy reference:** `bsafe/src/screens/tourist/TouristSpotsScreen.tsx`, `bsafe/src/data/touristSpotsData.ts`

---

### DECIDE — eSIM screen
**Legacy:** `bsafe/src/screens/esim/ESimScreen.tsx` (481 lines) — fully built UI, but all data was mock.
Had: filterable plan cards (by country, popular, best value, regional), search, plan details with data allowance, validity, price, speed, coverage countries, provider name. "Purchase" button was a TODO/console.log.

**New app status:** `ESim` route exists, `PlaceholderScreen`.

**Decision needed:** The mock data approach is not acceptable — showing fake prices for plans that don't exist is misleading. Options:
1. **Affiliate links directory** — curated list of providers (Airalo, Holafly, Nomad, Flexiroam) with descriptions and deep links to their apps/sites. No fake pricing. Simple, honest, maintainable.
2. **Airalo API integration** — Airalo has a partner API. Requires a partnership agreement. Post-launch scope.
3. **Cut it** — remove the tile from Home, remove the route.

**Recommendation:** Option 1. A clean "eSIM providers for [selected country]" screen with 4–6 trusted providers, their coverage summary, and an "Open in App Store / Visit website" button. Context-aware (filters by selected country). Takes ~2 hours to build properly.

---

### DECIDE — Insurance screen
**Legacy:** `bsafe/src/screens/insurance/InsuranceScreen.tsx` (537 lines) — fully built UI, all data was mock.
Had: plan type filter (basic/standard/premium/annual), trip duration slider affecting displayed price, coverage breakdown per plan (medical limit, emergency, cancellation, baggage), provider ratings, popular/recommended badges. "Purchase" button was a TODO.

**New app status:** `Insurance` route exists, `PlaceholderScreen`.

**Decision needed:** Same issue as eSIM — the pricing was fabricated. Options:
1. **Document store** — repurpose "Insurance" as "My Insurance" where the user stores their existing policy details (provider, policy number, cover dates, emergency number). Complements the EmergencyMedicalCard. Uses existing document storage infrastructure.
2. **Provider directory** — like the eSIM approach, list real providers (World Nomads, SafetyWing, Battleface, Allianz) with outbound links. No fake pricing.
3. **Cut it** — remove entirely.

**Recommendation:** Option 1 for launch (store your own policy), Option 2 as a future addition. The document infrastructure already exists. The insurance tile on the widget dashboard already expects this to exist.

---

### NEW — Onboarding flow
**Legacy:** Did not exist. Users landed directly on the home screen.

**What's needed:** A first-launch gate shown once, before the home screen. Three screens:
1. **Welcome** — app name, one-line value prop ("Travel smarter. Stay safer."), "Get started" button
2. **Where are you going?** — `LocationSelectorSheet` inline, pick country + city. "Skip for now" option.
3. **What matters to you?** — 4–6 toggle cards: Scam alerts, Live advisories, Emergency contacts, Trip planning, Friends & groups, Weather. Sets default widget strip. "Done" → home screen.

Persisted to `AsyncStorage` as `@be5afe_onboarded: true`. Never shown again after completion or skip.

**Design notes:** Clean, minimal, one full-screen card per step with a progress dot indicator. Brand gradient background. No more than 3 steps — onboarding that takes more than 30 seconds gets skipped.

---

### NEW — SOS / panic flow
**Legacy:** Did not exist.

**What's needed:** A hold-to-confirm SOS action accessible from the Emergency screen (and potentially a persistent floating button on Home). On confirm:
1. Sends current GPS coordinates to all friends who have an active location share
2. Posts a "SOS triggered" message to all groups the user is in
3. Shows the local emergency number for the selected country prominently with a one-tap dial button

**Design notes:** Hold-to-activate (3 seconds with animated fill ring) to prevent accidental triggers. Confirmation screen after activation showing who was notified. Cancel button during the hold. Does not auto-dial — that's a UX decision (some users want to choose which number to call). Infrastructure needed: GPS (exists), friends (exists), groups (exists), emergency numbers (exists). No new backend work required.

**Implementation note:** The hold gesture uses `react-native-reanimated` — animate a fill ring around a big red button, trigger on completion. All the data plumbing is already wired in `AppContext`.

---

### NEW — Global search
**Legacy:** Did not exist — only screen-level search bars.

**What's needed:** A search screen accessible from a search icon in the Home header. Searches across:
- Countries (by name → `CountrySafety`)
- Scam patterns (by title/description → `ScamAlerts`)
- Live alerts (by title/country → `LiveAlerts`)
- Safety tips (static content)

**Implementation:** All data is already in memory (seed bundle + AppContext). Pure client-side filter, no Firestore reads needed. Results grouped by type with section headers. Tap a result navigates to the relevant screen with the right params.

---

### NEW — Scam map layer
**Legacy:** Did not exist.

**What's needed:** A toggle on the Map tab that overlays accepted/auto-published ScamReport pins on the map. Clustered when zoomed out, individual pins when zoomed in. Tap a pin → brief scam card with title, category, severity, "Reported" badge.

**When to build:** After D6 (AI triage) produces enough volume of accepted reports to be geographically meaningful. With sparse data a scam map is misleading. Set a threshold (e.g. 50+ accepted reports with coordinates) before enabling this feature in the UI.

**Data requirement:** ScamReports need a `coordinates` field populated at submission time. The mobile submission form currently does not capture GPS at time of report — this needs adding to `ReportIncidentScreen` and the `CreateScamReportInput` type.

---

### NEW — Contextual home screen suggestions
**Legacy:** Did not exist.

**What's needed:** A "For you" card or strip on the Home screen that surfaces timely, relevant nudges based on data the app already has. Examples:
- "Flying to Japan in 8 days — 6 common scams to know" (from next trip + scam data)
- "3 new FCO alerts for Thailand since your last visit"
- "Your packing list is 40% done — 8 items remaining"
- "You land tomorrow — download offline maps now"

**Implementation:** A pure logic layer — `getHomeNudges(trips, alerts, packing, location)` → `Nudge[]`. No AI, no new infrastructure. Renders as a horizontally scrollable card strip between the MiniMap and the widget strip on Home. Dismissable per nudge (stored in AsyncStorage).

---

## Legacy reference index

When porting features, the primary reference is always the legacy codebase at `/Users/rm/code/bsafe/`. Key paths:

| What | Legacy path |
|---|---|
| All screens | `bsafe/src/screens/{feature}/` |
| Shared components | `bsafe/src/components/` |
| Static data files | `bsafe/src/data/` |
| Context / state | `bsafe/src/contexts/` |
| Utility functions | `bsafe/src/utils/` |
| Theme | `bsafe/src/theme/` (different structure — do not copy, use `@shared/theme` instead) |
| Navigation | `bsafe/src/navigation/` |

**Important:** The legacy app used a different architecture — no DI, no repository pattern, contexts imported Firebase directly, components used `useTheme()` returning dynamic styles. Do not copy the architectural patterns. Copy the UI logic, data shapes, and UX flows only. Rewrite to fit the modular architecture described in `AGENTS.md`.

---

## Cross-repo audit — gaps found in the modular rebuild

Performed 2026-05-24. Findings are grouped by screen/feature area. Each entry explains what existed in the legacy app that is missing, degraded, or stubbed in the current Be5afe build.

---

### Profile / Settings screen — severe regression

**Legacy:** A tabbed screen with 5 tabs: Personal, Account, Medical, Notifications, Settings. Each tab had real functionality:
- **Personal** — firstName, lastName, dateOfBirth, nationality, phoneNumber, all persisted to Firestore with offline queuing (`@bsafe_profile_pending` — updates queued when offline, synced on reconnect).
- **Account** — email display, password change, sign out.
- **Medical** — inline medical info (blood type, allergies, conditions, medications) — duplicated what `EmergencyMedicalCardScreen` does but with inline edit and Firestore sync.
- **Notifications** — push toggle, critical alerts toggle, persisted to AsyncStorage.
- **Settings** — dark mode toggle (wired to `ThemeContext`), default currency picker (wired to `AppCurrencyContext`), app version display.

**New app status:** `ProfileScreen` is a minimal stub — essentially a sign-out button and placeholder text. None of the above functionality is present.

**What to build for Phase 20 (Settings redesign):**
- Remove the medical tab — `EmergencyMedicalCardScreen` covers this. Decision V4.
- Personal info section: displayName, nationality, homeCountry. Persisted to Firestore (auth) / AsyncStorage (guest).
- Offline write queue: when offline, save update locally with a `@be5afe_profile_pending` key, flush on next app start if network available.
- Notifications section: two toggles (general, critical safety). Store in `UserPreferencesContext`.
- Settings section: dark mode toggle, default currency, default country — all already have storage hooks in `UserPreferencesContext`, just not wired to the UI.
- Account section: email (read-only), sign out button, delete account (D8 scope).

**Legacy reference:** `bsafe/src/screens/profile/ProfileScreen.tsx` (the tab logic and offline queuing pattern are worth porting)

---

### Currency — global app currency not wired

**Legacy:** `AppCurrencyContext` — a global "home currency" that the whole app uses as its display currency (expenses, trip costs, widget). The currency converter had an independent "session" currency separate from this. The widget read from `AppCurrencyContext` and let you type in an amount inline.

**New app status:**
- `CurrencyConverterScreen` has no memory between sessions — it resets to USD/EUR on each open.
- No global app currency concept — trip cost totals, expense totals, and the widget all have no shared currency setting.
- The widget renders a static list item with an icon — it does NOT render a live mini-converter with an inline text input like the legacy version.

**What to build:**
- Add `defaultCurrency` to `UserPreferencesContext` (already has a slot for it, just not wired to UI — Phase 20).
- Wire `CurrencyConverterScreen` to persist `fromCurrency` and `toCurrency` across sessions via `AsyncStorage`.
- The currency widget should render an interactive mini-converter (amount input + swap button + result) — not just a label.

**Legacy reference:** `bsafe/src/contexts/AppCurrencyContext.tsx`, `bsafe/src/components/widgets/CurrencyWidget.tsx`

---

### Widget dashboard — display-only, not interactive

**Legacy:** Each widget was a rich interactive component with live data:
- **CurrencyWidget** — inline amount input, swap button, live rate display.
- **TripCountdownWidget** — finds next upcoming trip, shows days remaining, trip name, date.
- **PackingProgressWidget** — shows packed/total count + progress bar.
- **ExpenseSummaryWidget** — shows total spent vs budget.
- **WeatherWidget** — live temperature + condition for selected location.
- **AlertsWidget** — count of recent unread alerts, tap → LiveAlerts screen.
- All widgets had a consistent `WidgetCard` chrome with edit-mode controls (delete, settings gear).
- The dashboard had drag-to-reorder (via `reorderWidgets`) and pull-to-refresh.

**New app status:** `WidgetsScreen` renders a plain FlatList of icon + label + remove button. No live data. No mini-converters. No trip countdown. No packing progress. No interactive content at all — it's a list manager, not a dashboard.

**What to build:**
- Build actual widget components: `WeatherWidget`, `CurrencyWidget`, `TripCountdownWidget`, `PackingProgressWidget`, `AlertsWidget`, `EmergencyWidget`, `SafetyWidget`.
- Each reads from AppContext — no new data fetching needed, all data is already available.
- The home screen's WidgetStrip (Phase 19) is the primary display surface. `WidgetsScreen` becomes the dashboard manager where you add/remove/reorder.
- `WidgetCard` chrome: title, icon, size badge, optional settings gear, delete in edit mode.

**Legacy reference:** `bsafe/src/components/widgets/`, `bsafe/src/contexts/WidgetContext.tsx`, `bsafe/src/utils/widgetUtils.ts`

---

### Weather screen — missing travel intelligence features

**Legacy:** The weather screen had two additional sections beyond the current and 7-day forecast:
- **Travel recommendation card** — `getTravelRecommendation(temp, code, precipitation, windSpeed)` → one-sentence safety advisory with severity badge (info / warning / danger). E.g. "Heavy precipitation expected. Pack rain gear and allow extra travel time."
- **Packing suggestions** — `getPackingSuggestions(tempMin, tempMax, precipChance, uvIndex)` → bulleted list of clothing/gear to pack given the forecast. E.g. "Light jacket, Sunscreen SPF 30+, Rain jacket".
- **UV index** — labelled Low/Moderate/High/Very High/Extreme with colour coding.
- **Wind speed** — labelled Light/Moderate/Strong/Very Strong.

**New app status:** `WeatherScreen` shows current temp + 7 day, wind speed number only, no UV, no packing suggestions, no travel recommendation.

**What to build:** Port `getUVIndexLevel`, `getWindSpeedLevel`, `getTravelRecommendation`, `getPackingSuggestions` from legacy as pure utility functions (no architecture concerns — they're stateless transforms). Add UV card, travel recommendation card, and packing suggestions section to `WeatherScreen`.

**Legacy reference:** `bsafe/src/utils/weatherUtils.ts` (all four functions are clean, pure, reusable)

---

### Scam alerts — bookmarks and native share lost

**Legacy:** Each scam pattern had two persistent actions:
- **Bookmark** — toggled via a star icon, persisted to `AsyncStorage` as `scam_bookmarks`. A "Bookmarked" filter tab showed only saved scams.
- **Share** — native `Share.share()` to send scam details as a text block via any OS share target (Messages, WhatsApp, etc.).

**New app status:** Neither feature exists. No bookmarking. No sharing.

**What to build:** Add bookmark icon to each scam card (AsyncStorage-persisted, `@be5afe_scam_bookmarks`). Add a Bookmarked filter tab. Add share button to scam detail view using the React Native `Share` API.

**Legacy reference:** `bsafe/src/screens/safety/ScamAlertsScreen.tsx` lines 57–132

---

### Local apps — quality difference

**Legacy:** The local apps screen was country-specific — it showed apps relevant to the selected country (e.g. Grab for SE Asia, WeChat Pay for China). Apps had emoji icons, descriptions, category colour badges, and an "offline download tips" section at the bottom.

**New app status:** The new `LocalAppsScreen` is a generic global directory of "recommended travel apps" (Google Maps, Maps.me, XE Currency, etc.) — not country-specific. This is actually a different product than the legacy feature. The new version has real App Store links (`iosUrl`, `androidUrl`) which is better than legacy. But the country-specificity is lost.

**Decision needed:** The two approaches serve different needs. Recommendation: keep the new generic directory as the primary screen (it's more robust with real links) but add a "Country-specific apps" section that renders when a country is selected (e.g. "In Thailand? Also download: Grab, Bolt, PromptPay QR"). The country-specific data from `bsafe/src/data/countryLocalApps.ts` can be imported as a static supplement.

**Legacy reference:** `bsafe/src/data/countryLocalApps.ts` (country-keyed app directory)

---

### Safe zones — missing directions + call actions

**Legacy:** Each police station / embassy card had two action buttons: "Get Directions" (opens native maps with coordinates) and "Call" (opens dialler with the venue's phone number). The legacy `SafeZonesScreen` also had a filter strip to toggle between Police, Embassy, and Hospital categories.

**New app status:** Cards show the map pin and address but have no action buttons. No call. No directions. Only Police and Embassy types are filtered — the category chip strip exists but may be incomplete.

**What to build:** Add "Directions" (`Linking.openURL('maps://...')` or `geo:lat,lng`) and "Call" (`Linking.openURL('tel:...')`) actions to each safe zone card. These are one-liner implementations — the data already has `phone` and `coordinates` fields.

**Legacy reference:** `bsafe/src/screens/safety/SafeZonesScreen.tsx`

---

### Documents — expiry reminder is incomplete

**Legacy:** Documents screen had an `ExpiryBadge` component that showed "Expires in X days" with colour coding (green > 90 days, orange 30–90, red < 30, grey = expired). The badge was prominent on each document card, and expired documents were visually distinct.

**New app status:** The new `DocumentsScreen` has `isExpiringSoon` and `isExpired` logic and shows a basic expiry text, but the formatting is raw (`isExpired ? 'Expired' : isExpiringSoon ? 'Expiring soon' : Expires ${item.expiryDate}`). No colour-coded badge. No "X days remaining" countdown. The date input is a raw text field (`YYYY-MM-DD`) with no date picker.

**What to build:**
- Upgrade expiry display to show "Expires in 42 days" computed from the date, with colour-coded badge (green/orange/red/grey).
- Replace the raw `YYYY-MM-DD` text input with a `DateTimePicker` (already planned for Phase 21 — use the same component).
- Consider a home screen nudge: "Your passport expires in 23 days" (feeds into the contextual suggestions feature).

**Legacy reference:** `bsafe/src/components/documents/ExpiryBadge.tsx`, `bsafe/src/utils/documentUtils.ts`

---

### Emergency screen — country numbers not dialable

**Legacy:** Emergency numbers for the selected country had one-tap dial — `Linking.openURL('tel:...')`. The screen also showed a "Dial" action button next to each number.

**New app status:** The new `EmergencyScreen` has `Linking.openURL('tel:...')` wired for personal emergency contacts, but the **country numbers section** (police, ambulance, fire) does NOT have dial actions — they're display-only text.

**What to build:** Add `onPress={() => Linking.openURL('tel:${number}')}` to each country emergency number row. One-line fix per number type.

---

### Profile screen — personal info stored nowhere

There is currently no concept of the user's personal profile (name, nationality, home country) in the new app beyond what Firebase Auth provides (`displayName`, `email`). This means:
- The emergency medical card cannot auto-populate name.
- Trip details have no "traveller" concept.
- The onboarding "who are you" step has nowhere to store its data.

**What to build:** A `UserProfile` type (`displayName`, `nationality`, `homeCountry`, `phoneNumber`) stored in `users/{uid}/profile` (Firestore, auth users) or `@be5afe_profile` (AsyncStorage, guests). A `useUserProfile` hook. Wire into `AppContext`. Phase 20 task.

---

### Decisions log additions (V18–V24)

| # | Decision | Reason |
|---|---|---|
| V18 | Widgets screen is a manager, not a dashboard — Home screen carries the live widgets | The WidgetsScreen should be where you add/remove/reorder; the Home WidgetStrip is where you see them live. This matches how iOS/Android home screen customisation works. |
| V19 | Scam bookmarks use AsyncStorage (`@be5afe_scam_bookmarks`), not Firestore | Bookmarks are purely personal, device-local preference — no sync needed, no auth dependency. Same pattern as packing list guest mode. |
| V20 | Currency converter persists last-used currencies to AsyncStorage | Saves the user re-selecting their travel currency on every open — one of the most-used flows. |
| V21 | Local apps screen keeps new global directory AND adds country-specific supplement section | The new version with real App Store links is strictly better than legacy mock data. Country-specific apps are an additive layer, not a replacement. |
| V22 | Safe zone cards need Directions + Call actions | The data already has phone + coordinates. Not adding these is a serious UX hole for someone in an emergency. |
| V23 | Document expiry display upgraded to "X days remaining" with colour-coded badge | Raw `YYYY-MM-DD` string is not useful. Travellers need to know "43 days" at a glance, with a visual warning when it's close. |
| V24 | UserProfile stored in `users/{uid}/profile` (Firestore) / `@be5afe_profile` (AsyncStorage guest) | Profile data is personal, needs to survive between sessions, and should be deletable under D8 GDPR scope. |

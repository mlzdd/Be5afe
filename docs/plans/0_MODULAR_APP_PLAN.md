# Modular App Plan

## Purpose

BSafe should evolve into a **reusable mobile app chassis** that happens to ship the BSafe travel product first.

The goal is not only to tidy the current repository. The goal is to preserve the useful capabilities already discovered here — maps, regionalised data, social features, AI chat, backend integration, theming, and syncable user data — so they can be recombined for future app ideas without rebuilding the same foundations each time.

---

## Core Principle

BSafe should become a **composition of modules**, not a monolith.

```text
BSafe =
  auth
+ maps/location
+ regional-data
+ social
+ chat/ai
+ safety
+ trips
+ travel-tools
+ emergency
+ widgets
```

**Location is the spine of BSafe, not just one module among equals.** The user's selected location (country + city) is the key that unlocks almost all content: alerts, scams, emergency numbers, local laws, health guides, safe zones, hospitals, and map overlays all derive from it. `modules/regional-data` and `modules/maps` are therefore foundational — they are not optional features, they are the axis the product turns on. Every geotagged data read flows through them.

A future app should be able to reuse only the pieces it needs:

```text
local community app = auth + maps + regional-data + social + chat
field-work app      = auth + maps + documents
lightweight app     = theme/ui + auth
```

---

## Architectural Rules

1. **Modules own their domain**
   - data types
   - repository contracts
   - services
   - hooks
   - screens/components specific to that module
   - tests

2. **The app shell composes modules**
   - startup
   - provider wiring
   - navigation registration
   - feature enablement

3. **Shared code stays boring and generic**
   - UI primitives
   - theme tokens
   - pure utilities
   - generic hooks
   - no business entities or domain models: `Trip` lives with trips, `Friend` lives with social, `CountryId` lives with regional-data

4. **Product-specific content does not leak into platform modules**
   - reusable country/city identity belongs in platform code
   - BSafe-specific scams, laws, health guides, and travel copy belong in BSafe product code

5. **Vendor choices stay behind interfaces where a seam is already useful**
   - screens and domain logic should not care whether data comes from Firebase, Supabase, a REST API, or local fixtures
   - do not build speculative second implementations just to prove portability; define the seam now, add another adapter when a real need appears

6. **Dependency direction is strict**

```text
products/*  ->  modules/*  ->  shared/*
modules/*   -X-> products/*
shared/*    -X-> modules/*
```

7. **Folder structure is not enough**
   - architecture must be enforced with public module APIs, import rules, and tests
   - the old mess must not be allowed to regrow inside cleaner directories

---

## State Ownership Policy

A modular folder layout will still decay if all state is treated the same. Use the smallest durable owner that fits the job.

```text
state kind                 preferred owner
------------------------   --------------------------------------------
local UI state             component or feature-local hook
server/cacheable state     query layer (TanStack Query where appropriate)
durable domain data        domain repository + module hook
cross-cutting app state    a small number of app-level providers only
form state                 local form library/hooks, not global context
```

### Rules

- React Context is for **distribution**, not as the default database for every feature.
- Do not put server state into Context when a query/cache layer is a better fit.
- Prefer module-local state first; promote to app-level state only when multiple distant consumers truly need it.
- Providers should correspond to durable app concerns, not every screen feature.
- When a context mostly wraps reads/writes to remote data, consider a repository plus query hooks instead.

### Storage ownership policy

Not every bit of state deserves cloud semantics. The rule is explicit per domain, not a blanket choice:

```text
storage tier       rule                                         examples
-----------------  -------------------------------------------  ----------------------------------
Static/product     shipped reference content, no writes         country seed data, scam/law/health
                   from the app                                 reference content, currency rates

Firestore          durable user-owned records that should       trips, expenses, friends, groups,
                   survive reinstall or sync across devices     location sharing, travel documents,
                                                                emergency contacts, packing lists

AsyncStorage       device-local: ephemeral preferences,         theme mode, draft forms, cached
                   caches, and offline mutation queues          selections, widget layout,
                                                                offline write queue
```

The test for each domain: **would the user feel betrayed to lose this data after reinstalling or switching phones?** If yes, it belongs in Firestore. If it is naturally local and losing it causes no real harm, AsyncStorage is correct. If it never changes at runtime, it is static product data.

Firestore offline persistence is enabled by default on iOS and Android, so choosing Firestore for sync-worthy data does not sacrifice offline behaviour. Offline writes are queued and replayed on reconnect. The one conflict to design around: Firestore uses last-write-wins per document, so concurrent edits to the same document from multiple devices need deliberate field-level structure.

**Per-domain classification for BSafe:**

| Domain | Storage | Reason |
| --- | --- | --- |
| Trips | Firestore | User would expect trips on a new device |
| Expenses | Firestore | Financial data must not be device-local |
| Friends / groups | Firestore | Social graph is inherently cross-device |
| Location sharing | Firestore | Real-time, multi-party by design |
| Travel documents (metadata) | Firestore | User would feel betrayed to lose these |
| Emergency contacts | Firestore | Safety-critical; must survive reinstall |
| Packing lists | Firestore | Useful across devices; low write volume |
| Theme mode | AsyncStorage | Device preference, not user identity |
| Draft forms | AsyncStorage | Ephemeral; discard on reinstall is fine |
| Cached location selection | AsyncStorage | Re-selectable if lost |
| Offline mutation queue | AsyncStorage | Flushed to Firestore on reconnect; not durable itself |
| Widget layout | AsyncStorage | Dashboard preference; re-configurable if lost |
| Country / city / safety reference data | Static product data | Read-only; seeded via admin portal |

---

## Cross-Module Dependency Policy

Modules may collaborate, but only through deliberate public seams.

### Allowed patterns

```text
modules/social  -> modules/auth/public
modules/maps    -> modules/user-preferences/public
products/bsafe/widgets -> public APIs from several modules
app/            -> composes modules together
```

### Rules

- Each module exposes a small public API from its root `index.ts` (or `public.ts`).
- Other modules import from that public API only — **no deep imports across module boundaries**.
- A module may depend on another module only when the dependency is conceptually stable and one-way.
- If two modules begin depending on each other, the boundary is wrong: extract a lower-level shared concept or move orchestration into `app/` / product composition.
- Cross-module workflows should be orchestrated at the highest sensible layer rather than hidden inside unrelated modules.

---

## Promotion Rule: Product Feature → Reusable Module

Do not promote something into `modules/` merely because it *might* be reusable.

A product feature should graduate into a reusable module only when most of these are true:

- a second credible product or use case exists
- its language and data model no longer depend on BSafe-specific concepts
- it has a stable public API
- removing BSafe-specific copy/content leaves a coherent capability behind
- the abstraction reduces duplication rather than increasing indirection

Until then, keep the feature in `products/bsafe/` with clean seams. It is cheaper to promote a proven feature later than to maintain a speculative abstraction now.

---

## Testing Strategy

There are currently no tests in the repo. The strategy for building a testable chassis:

```text
what                              when
--------------------------------  ------------------------------------------
repository/adapter integration    before any major module extraction — tests
tests                             prove the seam works before you rely on it
pure domain logic unit tests      as domain types and functions are extracted
module API smoke tests            before calling a module "reusable"
UI component tests                after module public APIs stabilise
```

### Rules

- Do not move files in bulk before the repository under them has at least one integration test. Moving untested code into a new folder is not a refactor; it is just relocating risk.
- Pure functions (formatters, validators, domain helpers) are the easiest first tests — start there.
- Repository integration tests hit a real backend or a local emulator; this is where the seam itself is proven.
- Pure domain tests stay unit-level.
- Above the repository boundary, mocks/fakes are acceptable when testing UI behaviour or hook consumers.
- A module is not genuinely reusable until it has a test harness that can run without BSafe-specific setup.

---

## Navigation Ownership

Each module exports its own route definitions and navigator fragment. The app shell composes them. Modules must not import from `app/navigation/` — that would invert the dependency direction.

```ts
// modules/trips/navigation.tsx
export const tripsRoutes = {
  TripsList: 'TripsList',
  TripDetail: 'TripDetail',
} as const;

export function TripsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={tripsRoutes.TripsList} component={TripsScreen} />
      <Stack.Screen name={tripsRoutes.TripDetail} component={TripDetailsScreen} />
    </Stack.Navigator>
  );
}

// app/navigation/index.tsx — composes module navigators
import { TripsNavigator } from '@/modules/trips/navigation';
import { SafetyNavigator } from '@/products/bsafe/safety/navigation';
// ...
```

Type-safe cross-module navigation (navigating from a safety screen to a trip screen) is orchestrated at the `app/` level or via typed navigation params passed down — never by a module reaching sideways into another module's route constants.


`module-registry.ts` should stay a light composition point, not become a plugin framework. A minimal shape is enough:

```ts
export interface AppModule {
  id: string;
  Navigator?: React.ComponentType;
  Providers?: React.ComponentType<React.PropsWithChildren>;
}
```

Modules expose what they contribute; `app/` decides which modules are mounted for a given product.

---

## Enforcement Mechanisms

The architecture should be difficult to violate accidentally.

- Ban direct Firebase/Supabase imports outside approved adapter locations.
- Add import-boundary lint rules when practical.
- Expose module public entrypoints and avoid cross-module deep imports.
- Add repository/hook tests around modules before large moves.
- Prefer path aliases that make module ownership obvious.
- Treat every new provider, shared utility, or infra abstraction as an architectural decision, not a convenience dump.
- Keep `infra/` narrow: vendor adapters and low-level integrations only, never domain behaviour.

---

## Target Repository Shape

```text
schema/                       # shared between all surfaces
  collections.ts              # Firestore collection path constants
  types/                      # shared data types (CountryId, ScamRecord, AlertRecord, etc.)
  rules/                      # Firestore security rule definitions

admin/                        # bsafe-admin web portal (React, not React Native)
  src/
    pages/
    components/
    services/

share-web/                    # minimal public location-share viewer
  # recipient-facing only: public token -> live map -> expiry state
  # separate deployment target from admin and mobile
  # behaviour:
  #   foreground open        -> live updates
  #   backgrounded           -> updates continue if permission granted
  #   app killed / lost      -> shows "last updated X min ago", not pretend-live
  # not built in the first migration phase; named here so the architecture accounts for it

src/                          # mobile app chassis
  app/                        # shell only: startup, navigation, composition
    navigation/
    providers.tsx
    module-registry.ts

  shared/                     # zero product knowledge
    ui/                       # buttons, cards, inputs, dialogs, badges
    theme/                    # colors, typography, spacing, shadows
    hooks/                    # generic hooks such as useDebounce
    utils/                    # pure helpers and formatters

  infra/                      # vendor adapters only — no domain behaviour here
    auth/
      firebase/               # current implementation
    database/
      firestore/              # current implementation
    realtime/
      firestore/              # current implementation
    ai/
      gemini/                 # current implementation
    # The directory structure signals swappable seams.
    # Add a second adapter (supabase/, openai/, etc.) when a real need appears — not speculatively.

  modules/                    # reusable platform capabilities
    auth/
    maps/
    regional-data/
    social/
    chat/
    user-preferences/

  products/
    bsafe/                    # BSafe-specific composition and domain features
      safety/
      safety-data/
      trips/
      travel-tools/
      emergency/
      widgets/
```

---

## Platform Modules vs Product Modules

```text
platform modules        product modules
--------------------    -------------------------
auth                    safety
maps/location           trips
regional-data           packing
chat/ai                 documents
social                  insurance
user-preferences        esim
theme/ui                emergency
                        widgets
```

### Platform modules

#### `auth`
Reusable authentication flow, auth state, session hooks, account identity.

BSafe supports two modes: authenticated (full account, synced data, social features) and guest (no account, local state only, manual location entry). Every module that needs a `userId` must handle the guest case — either returning empty data or skipping the remote call cleanly. Guest mode is not an afterthought; it is a first-class session state that `modules/auth` owns and exposes.

#### `maps`
Map rendering, location selection, place search, geocoding, directions, reusable location primitives.

#### `regional-data`
Reusable regional identity and lookup model:

```ts
type CountryId = string; // canonical internal id, e.g. "GB"
type CityId = string;    // canonical internal id, e.g. "GB-LON"
```

This module should handle country/city identity, normalization, lookup, and localisation helpers — not BSafe-specific travel content.

#### `social`
Friends, groups, posts, location sharing, and reusable social graph patterns.

This is one of the more complete parts of the existing app. Friends include request/accept/block flows. Groups have real-time Firestore-backed messaging, admin roles, and trip linking. Location sharing has live GPS tracking, expiry, and Firestore writes. These are not stubs — they are meaningfully implemented and represent a non-trivial migration effort.

One known incomplete feature: group messages support `type: 'text' | 'location' | 'alert'`, but location-type messages are stored and never rendered on a map. The data model is correct; the UI is missing. This should be completed during migration, not carried across as a known gap.

These four sub-concerns are grouped together now because they are adjacent. They are not a permanent unit. Location sharing is the most likely first extraction — it has no dependency on the social graph and is useful on its own (field-work apps, family apps). If groups and posts diverge from friends in data model complexity, that is the next split. Treat `social` as a staging area, not a permanent boundary.

#### `chat`
Chat UI, conversation state, and AI provider boundary. Gemini is one implementation, not the module definition.

#### `user-preferences`
Persistent user settings that cut across product modules: display currency, locale, theme mode, notification preferences. This is distinct from product-specific data — it is reusable wherever an app needs per-user configuration.

### BSafe product modules

#### `safety`
Scam alerts, local laws, safe zones, incident reporting, health guidance.

#### `safety-data`
BSafe-specific safety datasets and migrations: scams, laws, emergency numbers, health content, travel advisories.

#### `trips`
Trips, itinerary, activities, expenses.

#### `travel-tools`
Packing, documents, local apps, currency converter, and weather features.

eSIM and insurance are cut from the migration. The existing implementations are display-only catalogues with no purchase flow, no provider API integration, and no activation logic — they are effectively brochureware. They will not migrate into the new repo. If a real provider integration is built in the future, it starts from scratch with an actual API contract.

Note on currency: the repo currently conflates two things — `CurrencyContext` (converter tool) and `AppCurrencyContext` (which currency to display prices in app-wide). The converter belongs here. The display preference is a user setting and belongs in `modules/user-preferences/`, not in a product module.

#### `emergency`
Emergency contacts, medical card, emergency numbers UI.

#### `widgets`
Dashboard/widget system and BSafe widget implementations.

---

## How the Current Repo Maps to the Target Shape

### Move into `shared/`

| Current | Target |
| --- | --- |
| `src/components/common/` | `src/shared/ui/` |
| `src/components/ui/` | `src/shared/ui/` |
| `src/theme/` | `src/shared/theme/` |
| `src/hooks/useTheme.ts` | `src/shared/hooks/` or `src/shared/theme/` |
| generic helpers in `src/utils/` | `src/shared/utils/` |

### Move into `modules/`

| Current | Target |
| --- | --- |
| `src/contexts/AuthContext.tsx`, auth screens | `src/modules/auth/` |
| `src/services/location/`, `src/services/places/`, `src/services/sites/`, map screen, generic place components | `src/modules/maps/` |
| `src/services/gemini/`, chat screen/components | `src/modules/chat/` |
| country/city identity helpers and generic location reference data | `src/modules/regional-data/` |
| friends, groups, posts, location sharing | `src/modules/social/` |
| `src/contexts/AppCurrencyContext.tsx` (display preference only) | `src/modules/user-preferences/` |

### Move into `products/bsafe/`

| Current | Target |
| --- | --- |
| `src/screens/safety/`, `src/screens/alerts/`, scam/alert components | `src/products/bsafe/safety/` |
| BSafe-specific scam/law/health/emergency datasets | `src/products/bsafe/safety-data/` |
| `src/screens/trips/`, `src/components/trips/`, `TripsContext` | `src/products/bsafe/trips/` |
| packing, documents, insurance, eSIM, local apps | `src/products/bsafe/travel-tools/` |
| emergency screens/context | `src/products/bsafe/emergency/` |
| widget screens/components/contexts | `src/products/bsafe/widgets/` |

---

## Backend Strategy: Firebase Now, Swappable Later

### Practical choice

Keep Firebase for now. It is already present, mobile-friendly, and useful for authentication, real-time listeners, and rapid iteration.

Supabase may become attractive later when the app wants:

- more relational data
- SQL querying
- easier admin tooling
- explicit row-level security policies
- greater portability around structured datasets

### Design rule

Vendor adapters belong in `infra/`; domain-shaped repository contracts stay near the modules that use them.

A seam is valuable before a second implementation exists; a second implementation is not valuable until it has a real use. Start with the contract where it clarifies the current code, then add Supabase or another backend only when the product actually wants it.

Prefer this:

```text
modules/trips/repository.ts
modules/social/repository.ts
modules/regional-data/repository.ts
infra/database/firestore/*
infra/auth/firebase/*
```

Over this:

```text
infra/storage/StorageRepository.ts   # too broad; becomes a god-object
```

### Example interfaces

Architecture is not "there is an interface." Architecture is what an interface makes easy, hard, and impossible. At minimum, each contract should force decisions about identity, pagination, mutation shape, and errors before any implementation is written.

`TripRepository` is a good first example because it touches all of these:

```ts
// Typed domain errors — vendor errors are translated inside the adapter, never leaked out
export class TripNotFoundError extends Error {}
export class TripPermissionError extends Error {}

// Repository throws on failure; TanStack Query catches at the hook boundary.
// The happy path is always a clean return value.
export interface TripRepository {
  getTrips(userId: string): Promise<Trip[]>;
  getTripById(userId: string, tripId: string): Promise<Trip>;       // throws TripNotFoundError
  createTrip(userId: string, input: CreateTripInput): Promise<Trip>;
  updateTrip(userId: string, tripId: string, patch: UpdateTripInput): Promise<Trip>;
  deleteTrip(userId: string, tripId: string): Promise<void>;
}
```

Key decisions this interface encodes:
- **Identity**: trips are owned by a user — `userId` is explicit, not inferred from auth state inside the adapter
- **Errors throw**: no `{ data, error }` tuples; the error path is exceptional, not a return variant
- **Vendor errors translate**: a Firestore "permission-denied" becomes `TripPermissionError` inside the adapter; nothing above `infra/` ever sees a Firestore error code
- **Mutation shape is explicit**: `UpdateTripInput` prevents callers from patching fields such as `id`, `userId`, or `createdAt` by accident
- **No pagination yet**: `getTrips` returns all trips; add cursor-based pagination when the product needs it, not speculatively

Other module contracts follow the same shape. Define them when the module is extracted, not before.

Screens and product logic should depend on these contracts, not on Firestore or Supabase directly.

---

## Content Management: The Admin Portal

BSafe requires a large and ongoing volume of geotagged content: scams, local laws, health guides, emergency numbers, safe zones, travel advisories. This content cannot be managed by editing code. Staff need a tool to add, edit, and publish it without a developer involved.

This means BSafe is not one product — it is two:

```text
products/
  bsafe/          # the mobile app
  bsafe-admin/    # the content management portal (web)
```

Both products read from and write to the same Firestore collections. The mobile app reads; the admin portal writes.

### What the admin portal needs to do

- add and edit geotagged content per country and city (scams, laws, alerts, health info, emergency numbers, hospitals, safe zones)
- publish and unpublish content without a code deploy
- manage content status (draft, published, archived)
- upload images and supporting media
- preview how content will appear in the mobile app

### Architectural implications

**`safety-data` is not static seed data — it is CMS-managed live content.** The current plan describes `safety-data` as a migration artifact. That is only true for the initial data load. Long-term, all safety content is authored and owned by the admin portal. The Firestore schema must be designed with this in mind from the start.

**Security rules must distinguish roles.** The mobile app reads public geotagged content as any authenticated or guest user. The admin portal writes as a staff role. Firestore security rules need to encode this distinction explicitly — not as an afterthought after the schema is set.

**The admin portal is a separate product in the repo, not a module.** It is a web app (React, not React Native) and shares only the Firestore schema and any TypeScript types that describe the shared data model. It does not share UI components, navigation, or infra adapters with the mobile app.

### Shared boundary between mobile and admin

The only things that should be shared between the two products:

```text
shared data types (CountryId, CityId, ScamRecord, AlertRecord, etc.)
Firestore collection path constants
Firestore security rule definitions
```

These can live in a shared types package or a dedicated `schema/` directory at the repo root — not inside either product.

### Phase 0 implication

The new chassis repo should account for the admin portal from the start:

```text
src/          # mobile app chassis (existing plan)
admin/        # bsafe-admin web app
schema/       # shared Firestore types and collection constants
```

---

## Important Existing Problems to Correct

### 1. Two live Firebase worlds

The repo currently has both:

- `firebase.js` at root, used by the older user-data side
- `src/config/firebase.ts`, used by the newer global-data service layer

This is not merely duplication; both are still active. They must be consolidated behind a single infrastructure boundary before the old root file is deleted.

### 2. Two live theme systems

The repo currently has both:

- `theme-context.js` at root
- `src/theme/`

The root context is still used by live code. Fold theme mode/toggling into the proper shared theme system first, then remove the old root file.

### 3. UI features became state boundaries

The provider stack in `MainApp.js` shows that state boundaries were created feature-by-feature before the domain model settled. The fix is not simply “fewer contexts”; it is to align state ownership with durable domains and repositories, and to move cacheable server state into a query/cache layer rather than rebuilding a backend inside Context.

### 4. Regional identity is too loose

Countries and cities are currently represented variously by display name, slug, ISO code, and Firestore id. Internal code should use canonical ids consistently, while display names remain presentation data.

### 5. Static data is acting like runtime truth

Many files in `src/data/` are currently used directly by screens. Long-term they should become one of:

- seed data for migrations
- test fixtures
- product-owned static reference content

They should not remain an accidental backend.

### 6. Stub mode is silently on in production

`LocationContextProvider` and `SitesContextProvider` both default to `useStub={true}`. This means production users receive mock location data and hardcoded nearby sites rather than real results. This is not a dev flag — it is the live default. The new repo must treat stub/mock mode as an explicit opt-in for development and testing only, never a silent default.

### 7. Offline support is phantom

`HomeScreen` reads `@bsafe_profile_pending` and `@bsafe_offline_status` from AsyncStorage and displays offline UI state, but no code elsewhere writes or clears these flags in response to real connectivity changes. The offline story is display-only — it shows a state it cannot actually detect or recover from. A real offline strategy means: detect connectivity, queue mutations in AsyncStorage, flush the queue on reconnect, and reflect true sync status in the UI.

### 8. Duplicate service concepts

There are two different `PlacesService` concepts today:

- generic place search / Google Places style integration
- Firestore-backed regional places data

These should be renamed according to their actual responsibility, for example:

```text
PlacesApiClient
RegionalPlacesRepository
```

---

## What to Keep

- The product idea and full feature set
- The TypeScript migration
- The theme/token system
- The service-layer instinct and Firestore cost-conscious design
- The existing UI/component work worth generalising
- Maps, social, chat, regionalisation, widgets, and syncable personal data as reusable capabilities
- The data architecture docs that capture real, still-valid decisions

---

## What to Archive, Collapse, or Remove

| Item | Action | Reason |
| --- | --- | --- |
| `demo-app-template/` | archive first, then delete if no longer useful | separate web prototype; useful fossil, but not part of the mobile chassis |
| `gemini-proxy-server.js` | move into chat/server boundary or remove if genuinely unused | orphaned at repo root |
| `theme-context.js` | delete after consolidation | superseded by shared theme system once migrated |
| `firebase.js` | delete after consolidation | superseded by unified infra once migrated |
| most `docs/CTXT_*.md` | prune after architecture settles | many patterns should become obvious from code structure |
| `src/data/mockData.ts` | move to fixtures if still needed | mock runtime data should not masquerade as product truth |
| city/country/scam static files | reclassify into seed/product data | useful content, wrong current role |
| `WidgetContext` + `WidgetViewContext` | merge — `WidgetContext` holds config list, `WidgetViewContext` holds UI state (modal open/close); both belong inside the `widgets` module as a single concern | split by implementation history, not domain need |

---

## Migration Plan for a Clean-Slate Repo

This is no longer a live-in-place refactor. The preferred path is to create a new chassis repo cleanly, then migrate proven capabilities across in deliberate slices while the old repo remains runnable as a reference.

The migration is the spine of the work, not a cleanup footnote.

### Phase 0 — Create the chassis repo

- create a new repository with the target folder structure already in place
- configure the baseline tooling from day one:
  - TypeScript
  - path aliases
  - ESLint import-boundary rules
  - test runner
  - Expo / React Native setup
- create `src/app/`, `src/shared/`, `src/infra/`, `src/modules/`, and `src/products/bsafe/` as mostly empty top-level domains
- create `admin/` as the skeleton for the bsafe-admin web portal (React, not React Native)
- create `schema/` at the repo root for shared Firestore types, collection path constants, and security rule definitions — the only code shared between mobile and admin
- wire Firebase once, correctly, in `src/infra/`
- establish one theme system from day one
- add a minimal smoke test so the new repo proves it can boot, typecheck, lint, and run tests before migration begins
- carry over no legacy root files, no duplicate config, and no historical junk by default
- all API keys in environment variables only — no keys hardcoded in source files; the Gemini key exposure in `gemini-proxy-server.js` is a known violation that must not be replicated

### Phase 1 — Migrate shared foundations

Move the least entangled building blocks first:

- theme tokens
- UI primitives
- generic hooks
- pure utilities

These should have no dependencies on product modules or vendor-specific infrastructure. The old repo remains the reference implementation; nothing is deleted from it yet.

### Phase 2 — Migrate and prove the first module: `chat`

Start with the cleanest reusable module:

- move chat UI and Gemini integration behind a real `ChatCompletionClient` interface
- make Gemini the first concrete implementation, not the module definition
- add the first **module-level integration test** here
- use this phase to prove the module conventions, public API pattern, and test strategy before heavier modules move

### Phase 3 — Migrate `auth`, `user-preferences`, and `infra` together

Auth and user preferences both depend on infrastructure and both cut across every product module. Migrate them as one slice:

- establish the real auth repository contract
- wire Firebase correctly through the new infra boundary
- migrate authentication screens/hooks/providers onto that contract
- do not carry over the old split between `firebase.js` and `src/config/firebase.ts`
- migrate `user-preferences` at the same time — display currency, locale, theme mode
- resolve the `AppCurrencyContext` / `CurrencyContext` split: display preference lands in `user-preferences`, the converter tool stays in `products/bsafe/travel-tools/`
- user-preferences must be in place before any product module that reads display currency or locale

### Phase 4 — Migrate `regional-data`

Lay the regional identity rail before maps depend on it:

- introduce canonical `CountryId` / `CityId`
- centralise normalization and lookup
- separate reusable regional primitives from BSafe-specific travel/safety datasets
- decide which old static files become seed data, fixtures, or product-owned reference content

### Phase 5 — Migrate `maps`

Once regional identity is stable:

- move map UI, location selection, geocoding, directions, and place search
- ensure maps consume canonical regional identifiers rather than raw display strings
- separate generic map capability from BSafe-specific safety overlays
- rename duplicate place concepts by responsibility, e.g. `PlacesApiClient` vs `RegionalPlacesRepository`

### Phase 6 — Migrate `social`

Migrate the social module before BSafe product modules, as several product features (groups, location sharing) depend on it:

- migrate friends, groups, posts, and location sharing behind a `SocialRepository` contract
- treat `social` as a staging area: keep the four sub-concerns grouped but with internal seams visible
- add at least one integration test before calling the module migrated
- do not over-engineer the boundary yet — location sharing is the likely first future extraction, but that split happens when there is a concrete second use case, not now

### Phase 7 — Migrate BSafe product modules one at a time

Move product domains across only after the chassis seams exist:

1. `safety`
2. `trips`
3. `travel-tools`
4. `emergency`
5. `widgets`

For each module:

- define the real repository/contracts it needs
- migrate one vertical slice at a time
- replace runtime mock/static imports with repository or product-data access
- add at least smoke-level test coverage before calling the module migrated

The old repo remains runnable throughout as a behavioural reference.

### Phase 8 — Promote the new repo to the BSafe source of truth

- the new repo becomes the active BSafe codebase
- archive the old repo rather than deleting it
- leave `demo-app-template/` behind in the archived old repo; it does not migrate into the chassis
- only after the new repo has fully replaced the old one should stale migration notes or obsolete artifacts be pruned from active development


### Phase 12A — Firebase Development Environment

Before further Firebase-backed feature work proceeds, set up the Firebase Emulator Suite as the default development backend.

#### Decision

Do **not** build a dummy Firebase backend as the main development path. The repository contracts already provide the abstraction seam; day-to-day development should use real Firebase behaviour through local emulators so auth, Firestore queries, listeners, and security rules are exercised honestly.

```text
unit tests             -> small fakes/mocks above the repository boundary where useful
integration tests      -> Firebase Emulator Suite
manual development     -> Firebase Emulator Suite by default
staging / production   -> real Firebase projects
```

#### Why this phase belongs here

Earlier phases can be built safely around contracts, local stores, and test doubles while the chassis takes shape. Once Firebase-backed behaviour becomes load-bearing — auth, trips persistence, friends/groups, live listeners, location sharing, and security rules — the backend model needs to be proven against Firebase itself rather than a parallel fake.

#### Deliverables

- configure the Firebase Emulator Suite for Auth and Firestore
- add local emulator connection logic in `infra/` for development/test environments
- create explicit environment separation for emulator, staging, and production
- add a repeatable local seed/reset workflow where useful
- run repository integration tests against the emulator
- validate Firestore security rules against emulator-backed tests before relying on them in production
- document the local Firebase workflow for future development

#### Operating rule

```text
No dummy backend for normal Firebase development.
Use the emulator locally; use fakes only above the repository boundary when a test specifically benefits from them.
```


---

## Definition of Done

The modularisation effort is successful when:

- a new app can be composed from selected modules without copying BSafe-specific code
- screens do not import Firebase/Supabase directly
- server state is not being recreated ad hoc in feature contexts
- country/city identity is canonical and consistent
- BSafe-specific datasets are clearly separated from reusable regional infrastructure
- modules communicate through public APIs rather than deep imports
- modules navigate via exported route definitions, not by importing each other's internals
- a developer can tell where new code belongs without reading a large guide first
- removing a product module does not damage unrelated platform modules
- backend replacement is a local adapter exercise, not a repo-wide rewrite
- every reusable module has at least a smoke-level test harness
- repository integration tests exist before any module is extracted
- the boundary rules are enforced well enough that entropy has to work to get back in

---

## Final Framing

This repo should become useful even if BSafe itself never becomes a commercial success.

Its durable value is the reusable foundation it already hints at:

- maps and location
- regionalised content
- social graph and groups
- AI chat surfaces
- syncable personal data
- reusable mobile UI/theme primitives

The job now is to make those capabilities deliberate, composable, and trustworthy.

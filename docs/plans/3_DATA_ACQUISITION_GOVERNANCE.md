# Data Acquisition & Governance

Last updated: 2026-05-17
Status: All 18 decisions made. One remaining pre-launch action item (legal review of Decision 18). Ready for implementation planning.

---

## Companion Document

**DATA_PLATFORM_DESIGN.md** — operational data engineering layer: Firestore collection model, event
model, diff/tombstone protocol, geospatial indexing, schema versioning, idempotency, PII
classification, and analytics path. Neither document is complete without the other.

---

## Purpose

BSafe is not only a software product. It is also a **travel-safety information product**.

The app architecture defines how data is stored, queried, and displayed. This document defines where that data comes from, how trustworthy it is expected to be, who may publish it, and how it stays current over time.

The goal is to avoid building a polished app on top of accidental, stale, or unverifiable content.

---

## Core Principle

Every dataset in BSafe must have an explicit answer to five questions:

1. **Where did it come from?**
2. **How trustworthy is that source?**
3. **Who is allowed to publish or change it?**
4. **How often must it be reviewed?**
5. **What happens when it becomes stale or disputed?**

If a dataset cannot answer those questions, it is not production-ready data yet.

---

## Product Centre of Gravity

BSafe's core product is **regional scam intelligence**:

```
scam map + scam patterns + scam reporting + trust/verification pipeline
```

The surrounding features — trips, social, chat, weather, packing, documents, widgets, and other travel tools — are important retention and utility surfaces. But the data-governance system is designed first around scam intelligence, because that is where BSafe makes its most distinctive public claims and where user-submitted public data enters the system.

**Consequence:** Build the governance model deeply for scam reporting first, then reuse or adapt it for other datasets where appropriate.

---

## Decision 1 — BSafe's Honest Data Claim

**Decided: Community + editorial hybrid.**

BSafe owns a verified editorial base layer. Community reports can strengthen or enrich that layer over time, but never bypass it. The product makes two kinds of claims simultaneously:

- BSafe-researched and reviewed content ("Confirmed")
- Community-observed incidents that have passed automated and/or human review ("Reported")

Users always know which kind of claim they are reading. BSafe never presents community data as editorially verified without a human review step.

---

## Data Classes

```
class                     meaning
------------------------  -------------------------------------------------------
authoritative reference   sourced from official or primary institutions
curated editorial         researched and maintained by BSafe staff / admins
third-party live          fetched from external APIs or official feeds
community submitted       user reports pending or post moderation
personal user data        private data owned by an individual user
```

### Trust order

```
authoritative reference > curated editorial > third-party live > community submitted
```

This is not a statement that community data is bad. It means the product always knows which claims have been institutionally or editorially verified and which still require review.

---

## Decision 5 — User-Facing Trust Tier Labels

**Decided: Confirmed / Reported / Flagged. With a secondary review signal on Reported — not a third tier.**

| Label | Meaning | Applies to |
|---|---|---|
| **Confirmed** | BSafe editorial — reviewed and published by a BSafe operator | ScamPatterns in `published` state |
| **Reported** | Community-sourced — auto-published (high confidence) or human-accepted | ScamReports in `auto_published` or `accepted` state |
| **Flagged** | Actively disputed, or a Confirmed pattern that has received significant contrary evidence | ScamPatterns in `disputed` state |

Internal states that do not change the user-facing label:
- `needs_review` — still shows **Confirmed** in the app; flagged in admin only
- `draft` — not visible to users

### Reported: reviewed vs unreviewed sub-signal

`auto_published` and `accepted` reports both show as **Reported**, but they carry meaningfully different trust. A user has reasonable grounds to care whether a human reviewed something.

The solution is a secondary visual indicator — not a third top-level tier. In the app UI, `accepted` reports show **Reported** with a small person-check icon (✓ reviewed). `auto_published` reports show plain **Reported** with a caveat line: *"Not yet reviewed by BSafe."*

This preserves the three-tier system while surfacing the distinction honestly. The icon and caveat are implementation details for the design system; the data model already supports it via the `status` field.

Do not add a fourth label. The cognitive load of four trust states is higher than the benefit, and it creates pressure to keep inventing new tiers as the system grows. The sub-signal approach scales: future nuances (e.g. corroborated by multiple accepted reports) can be expressed as additional icon variants without changing the label vocabulary.

---

## Scam Intelligence: Full Lifecycle Design

Scam intelligence is the first dataset family that needs a complete lifecycle. It is both the core product and the main public user-contributed data stream.

### Definitions

```
ScamPattern   = canonical BSafe knowledge about a known scam type in a region
ScamReport    = a specific user-submitted observation or incident
ScamGroup     = a parent grouping linking related or evolving ScamPatterns
```

### Decision 2 — ScamPattern Lifecycle

**Decided: draft → published → needs_review / disputed → archived. Grouping instead of superseding.**

```
draft
  → published           (operator publishes; user-facing label: Confirmed)
      → needs_review    (nextReviewAt passed, or report volume spike; still shown as Confirmed; admin flagged)
          → published   (re-reviewed, no change or updated)
          → archived
      → disputed        (contradicted by official source or sustained contrary evidence; user-facing label: Flagged)
          → published   (dispute resolved — pattern updated or cleared)
          → archived    (dispute resolved — pattern withdrawn)
      → archived        (no longer relevant; removed from app; kept for audit)
```

**Grouping rule:** When a scam evolves or spawns variants, new ScamPatterns are created and linked to a shared `ScamGroup`. Old patterns are archived but not deleted. The app can display the evolution history. No pattern is silently overwritten.

### Decision 3 — ScamReport Pipeline

**Decided: Submit → AI triage → auto-publish if high confidence → human queue if low confidence.**

```
submitted
  → ai_triaged
      → auto_published      (high composite confidence; user-facing label: Reported; unreviewed caveat shown)
      → pending_review      (low/medium confidence; enters human moderation queue ordered by severity)
          → accepted        (user-facing label: Reported)
          → rejected        (not shown; archived with rejection reason)
          → duplicate       (linked to existing report; not shown separately; provenance preserved)
  → merged                  (content folded into a ScamPattern by an operator; report archived with merge reference)
```

**Hard constraint:** Auto-published reports are never permitted to modify a ScamPattern's content, severity, or status automatically. Community data influences the editorial layer only through a human operator action.

**UI implementation requirement:** The separation between auto-published community reports and BSafe editorial content must be visually unmistakable — not just technically correct. A user reading an auto-published report in the same visual style as a Confirmed pattern would reasonably conclude BSafe stands behind it. The distinction must be enforced at the design-system level: different card treatment, different label colour, the "Not yet reviewed by BSafe" caveat line on every auto-published report. If the UI ever makes these look equivalent, Decision 1 (community + editorial hybrid) is violated in practice regardless of what the data model says. This is a product quality bar, not just a legal one.

### Decision 4 — AI Triage Signals

**Decided: All four signals. Spam/abuse is a hard veto. The rest form a composite confidence score.**

| Signal | Role | Gate or input? |
|---|---|---|
| Spam / abuse score | Bot detection, coordinated flooding, business suppression attempts | **Hard veto** — fails here, report is rejected immediately |
| Category + pattern match | Which ScamPattern does this fit? Does it corroborate or contradict? | Composite input |
| Severity estimate | Financial loss signals, physical risk language, urgency indicators | Composite input — elevates position in human review queue |
| Location confidence | GPS at submission vs stated location; plausibility for scam type in region | Composite input — not a gate; delayed reports from home are legitimate |

**Composite routing:**

```
spam_score ≥ threshold                → rejected (no human time spent)
composite HIGH (all other signals)    → auto_published (Reported, unreviewed caveat)
composite MEDIUM / LOW                → pending_review (human queue, ordered by severity)
```

The AI triage step always produces structured metadata — not just a routing decision. That metadata is stored on the report and surfaces in the admin portal for filtering and sorting.

---

## Decision 6 — Emergency Numbers Source Strategy

**Decided: Wikidata seed + ITU verification pass for top 40 countries. Unverified records withheld from the app at launch — not shown with a caveat, not shown at all.**

### Why not manual curation alone

190 countries is not maintainable by hand. Manual curation as the only source creates a false confidence in coverage.

### Source pipeline

1. **Wikidata seed script** — SPARQL query against `P3999` (emergency), `P4290` (police), `P4291` (fire), `P4292` (ambulance) for all countries. Gets ~120–140 countries. Each record tagged `sourceType: 'wikidata'`, `confidence: 'medium'`.

2. **ITU verification pass** — ITU (International Telecommunication Union) maintains official emergency number records. For the top 40 most-visited countries, cross-reference against ITU publications. Verified records elevated to `sourceType: 'official'`, `confidence: 'high'`.

3. **Display policy for unverified records** — countries with `confidence !== 'high'` are **not shown** in the emergency numbers list at v1 public launch. Instead, those countries display: *"Emergency numbers for this country have not been independently verified. Contact your embassy or check with local authorities on arrival."* This is stricter than a caveat — showing potentially wrong numbers in a life-safety context is worse than showing nothing. A caveat feels like a disclaimer; withholding unverified numbers is an honest product decision. The number of `high`-confidence countries will grow over time as verification passes are completed. Medium-confidence records remain in Firestore and are visible in the admin portal for prioritised verification.

4. **Review cadence** — every 6 months, re-run the Wikidata diff query to catch changes. ITU-verified records reviewed annually or on known change.

### The Wikidata query is buildable now

A single SPARQL query to `query.wikidata.org` returns all countries with known emergency numbers as structured JSON. This can be a migration script (`scripts/seed-emergency-numbers.ts`) with the same pattern as the existing country/scam migration.

---

## Decision 7 — Local Laws & Health Guidance

**Decided: Curated editorial with mandatory legal/health disclaimer on all content.**

### Why not automated feeds for laws

Legal content is too jurisdiction-specific and interpretation-dependent to safely automate. A law that exists on paper may not be enforced; enforcement that exists may not be written down. Automated sources would create false precision.

### Why not WHO/CDC feeds for health

Useful as research sources, but the feeds are not designed for mobile consumption. Health guidance must be rewritten for clarity and scoped to traveller-relevant scenarios. BSafe's voice, not WHO's formatting.

### Rules for both datasets

- Every record carries: `sourceUrl`, `lastReviewedAt`, `reviewedBy`, `nextReviewAt`, `confidence`
- Source references are required before publish — opinion without citation does not ship
- The app does not need to surface all source metadata to users, but the admin portal requires it
- Major safety claims are reviewable independently from presentation copy

### Disclaimer requirement

**Local laws:** Every local laws screen carries a persistent banner:
> *"This is general guidance only, not legal advice. Laws and enforcement vary. Verify with local authorities or a qualified legal professional before relying on this information."*

**Health guidance:** Every health guide screen carries:
> *"Consult a doctor or travel health clinic before your trip. This information is for general reference only."*

These disclaimers must also appear in BSafe's terms of service — not only in the UI.

---

## Decision 8 — Live Travel Alerts & Advisories

**Decided: Official government feeds as the base + BSafe editorial alerts for gaps.**

### Official feeds (no API key required)

| Source | Coverage | Format |
|---|---|---|
| Australia DFAT (Smartraveller) | ~170 countries | JSON per country |
| UK FCO (gov.uk/foreign-travel-advice) | ~220 countries | JSON feed + individual pages |
| US State Dept (travel.state.gov) | ~200 countries | RSS + JSON per country |

All three are free, public, update frequently, and require no authentication.

### Alert data model

```ts
interface Alert {
  id: string;
  source: 'dfat' | 'fco' | 'state_dept' | 'bsafe_editorial';
  country: CountryId;
  severity: 'advisory' | 'warning' | 'do_not_travel';
  title: string;
  body: string;
  publishedAt: string;
  expiresAt?: string;          // BSafe editorial only
  sourceUrl: string;
  lastFetchedAt: string;       // feed-sourced alerts
}
```

### BSafe editorial alerts

For events not yet covered by official feeds (rapid-onset local news, festival-specific risks, event-driven scam spikes), BSafe operators can publish editorial alerts. These are:

- Clearly distinguished from official-source alerts in both admin and app UI
- Subject to the same `draft → published → archived` lifecycle as ScamPatterns
- Always carry `expiresAt` — editorial alerts without an expiry date should not be allowed to publish

### Freshness

Feed-sourced alerts are fetched on a schedule (Cloud Function cron or app-start diff). BSafe editorial alerts are managed entirely through the admin portal.

---

## Decision 9 — Personal Data Persistence

**Decided: Packing lists and medical card both move to Firestore.**

| Domain data | Storage | Decision |
|---|---|---|
| Theme mode | AsyncStorage | Device preference — sync optional later |
| Widget layout | AsyncStorage | Per-device preference |
| Packing list | **Firestore** | Users expect this to survive reinstall |
| Travel documents | AsyncStorage (now) | Intentionally local until security model is mature |
| Emergency contacts | Firestore | Already there — account-level safety data |
| Medical card | **Firestore** | Critical safety data; must survive device loss |
| Trips / itinerary | Firestore | Already there |
| Friends / groups | Firestore | Already there |

### Medical card security note

Firestore at-rest encryption is on by default (Google-managed keys). Owner-only security rules (`auth.uid == uid`) ensure no other user can read the data. This is acceptable for v1.

If BSafe later pursues HIPAA compliance or user-controlled encryption, that requires a separate architecture review. Do not conflate that future requirement with the v1 decision — ship the Firestore sync now.

---

## Decision 10 — Admin Portal v1 Scope

**Decided: Simple React + Firebase internal web app, built before public launch.**

### Why not Firebase console alone

The Firebase console has no workflow, no review states, no stale-content visibility, and no moderation queue. Managing editorial content at scale through direct Firestore document editing is error-prone and leaves no audit trace.

### v1 screens (minimum viable admin)

1. **Scam Patterns** — list (with status badges, stale flags), create, edit, publish, archive
2. **Moderation Queue** — incoming ScamReports; accept / reject / mark duplicate / merge into pattern
3. **Stale Content** — all records past `nextReviewAt`, ordered by most overdue
4. **Emergency Numbers** — view and edit with source metadata fields
5. **Alerts** — create, publish, archive BSafe editorial alerts; view feed-sourced alerts

### Minimal audit trail — included in v1

Full audit history (complete change log with diffs, reviewer notes, appeal trails) is a v2 feature. However, three fields must be written on every content mutation in v1:

```ts
updatedAt: string;        // ISO timestamp of last write
updatedBy: string;        // UID or email of the operator who made the change
previousStatus: string;   // the status before this write (e.g. 'draft' → 'published')
```

These three fields cost a single Firestore merge on every write and require no UI surface in v1. They are the minimum needed to answer "who published this and when?" — a question that will arise the moment any safety content is disputed or wrong. Safety data without any change provenance becomes unmanageable quickly once more than one person is operating the portal.

### Out of scope for v1

- Full audit log UI (surfacing the full history of every change)
- Mobile preview
- Analytics / report volume dashboards
- User management beyond basic Firebase Auth roles
- Full source provenance UI

These are v2 features. The v1 admin portal exists to unblock editorial operation, not to be a full CMS.

### Tech approach

- React + Vite, deployed to Firebase Hosting (same project, separate path or subdomain)
- Firebase Auth with role claim (`admin: true`) — only users with this claim can access the portal
- Reads/writes directly to Firestore using the same collections as the mobile app
- No separate backend — the security rules enforce the access model

---

## Decision 11 — Mobile Data Load Strategy

**Decided: Bundled seed file at build time + Firestore diff on app start.**

### Why

A safety app must work offline from install. If someone's phone is on airplane mode in an emergency, they must still be able to see emergency numbers, known scam patterns, and cached health guidance. A network-dependent first load is not acceptable for this use case.

### Mechanics

1. **Build-time seed script** (`scripts/export-seed.ts`) — queries Firestore for all published content and writes a snapshot to `assets/seed.json`. Run as part of the EAS build process.

2. **App start diff** — on launch with network available, fetch a lightweight manifest: `{ lastUpdatedAt: string }`. If newer than the bundle timestamp, fetch only changed records (Firestore `where('updatedAt', '>', bundleTimestamp)`).

3. **Local merge** — diff results are written to AsyncStorage and merged with the bundle at read time. The bundle is the floor; AsyncStorage additions are the ceiling.

4. **Offline fallback** — if no network, the app reads from the bundle + any previously cached diff. No loading spinners for content that was available at last sync.

### Firestore read optimisation

This model means a typical app session costs 1–3 Firestore reads (the diff check + any changed records), regardless of how many content screens the user visits. This is the primary mechanism enabling the "12,500 DAU on free tier" cost target.

---

## Source Metadata Requirements

Every BSafe-managed content record that makes a factual claim must support source metadata.

**Minimum required fields:**

```ts
interface SourceMetadata {
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'official' | 'editorial' | 'api' | 'community';
  retrievedAt: string;
  lastReviewedAt: string;
  reviewedBy: string;
  confidence: 'high' | 'medium' | 'low';
}
```

**Publication lifecycle fields:**

```ts
interface PublicationMetadata {
  status: 'draft' | 'published' | 'needs_review' | 'disputed' | 'archived';
  publishedAt?: string;
  expiresAt?: string;
  nextReviewAt: string;
}
```

The mobile app does not expose every field to users. The admin portal requires them before publish.

---

## Freshness and Review Cadence

| Data type | Review cadence | Trigger conditions |
|---|---|---|
| Emergency numbers | 6 months (Wikidata diff) + annual ITU check | Official source change, user report of wrong number |
| Local laws | 6–12 months depending on jurisdiction volatility | Known legislation change, user / legal report |
| Health guidance | 3–6 months | Major WHO/CDC guidance update, disease outbreak |
| Travel advisories / alerts | Event-driven; explicit expiry required on editorial alerts | News spike, government advisory level change |
| Scam patterns | 6 months + review triggered by report volume spike | ≥10 new reports on a pattern in 30 days |
| Emergency medical card content | N/A — user-authored, no review cadence | User-initiated only |
| Hospitals / safe zones | 6–12 months | User correction report, place closure signal from Places API |
| Local apps | 12 months | App discontinued, major UX change, user feedback |

Records past `nextReviewAt` must not silently disappear from the app. They remain visible but the admin portal flags them as stale. "Stale" means "due for review", not "wrong."

---

## Data Inventory: Resolved Decisions

| Data type | Class | Source strategy | Sync target | Notes |
|---|---|---|---|---|
| Countries, ISO codes, dial codes | Authoritative reference | REST Countries API + static seed | Firestore (bootstrap) | Changes rarely; re-seed on major ISO updates |
| Cities and coordinates | Authoritative reference + curated | Static seed from established geo datasets | Firestore | Must align with `CountryId` / `CityId` model |
| Scam patterns | Curated editorial | BSafe-authored, admin portal | Firestore | Core product; full lifecycle managed |
| Scam reports | Community submitted | User submissions via app | Firestore | AI triage → human review pipeline |
| Emergency numbers | Authoritative reference | Wikidata seed + ITU verification | Firestore | Only `confidence: 'high'` records shown in app. Unverified records withheld — country shows "not verified, contact embassy" message instead. |
| Local laws | Curated editorial | Researcher-sourced, admin portal | Firestore | Legal disclaimer mandatory |
| Health guidance | Curated editorial | Researcher-sourced, admin portal | Firestore | Health disclaimer mandatory |
| Travel advisories / alerts | Third-party live + editorial | DFAT / FCO / State Dept feeds + BSafe editorial | Firestore | Editorial alerts require `expiresAt` |
| Hospitals / police / embassies | Third-party live (v1) | Google Places API (live query) | Not persisted (v1) | Coordinate-based; not BSafe-authored. **Expected to graduate** to hybrid: live query + BSafe verification overlay + saved safe zones. Do not treat "not persisted" as permanent — design the Places API layer with an extension point. |
| Tourist spots | Third-party live | Google Places API | Not persisted | Lower governance priority |
| Local apps | Curated editorial | BSafe-researched, static for now | Static bundle (upgrade to Firestore later) | Review annually |
| Weather | Third-party live | Open-Meteo API | Not persisted — live only | No key required |
| Currency rates | Third-party live | Exchange rate API | Short-term cache only | Live third-party; not internally verified |
| Packing lists | Personal user data | User-authored | **Firestore** | Must survive reinstall |
| Travel documents | Personal user data | User-authored | AsyncStorage (now) | Upgrade to Firestore after security model designed |
| Emergency contacts | Personal user data | User-authored | Firestore | Already implemented |
| Medical card | Personal user data | User-authored | **Firestore** | Critical safety data; must survive device loss |
| Widget configuration | Personal user data | User-authored | AsyncStorage | Per-device preference |
| Trips / itinerary | Personal user data | User-authored | Firestore | Already implemented |
| Friends / groups | Personal user data (social) | User-authored | Firestore | Already implemented |

---

## Storage Ownership Policy

BSafe uses three persistence modes, each with a distinct role:

```
storage mode           use for
---------------------  -------------------------------------------------------
static bundled data    bootstrap/seed content; offline fallback floor
AsyncStorage           device-local preferences, caches, offline queues, drafts
Firestore              durable cloud-backed user data and published live content
```

### Default rule

- If the user would feel betrayed to lose it after reinstalling or changing phones → **Firestore**
- If it is ephemeral, device-specific, or merely a cache → **AsyncStorage**
- If it is published BSafe content that needs admin management or freshness tracking → **Firestore**
- If it is content that must work on a plane with no signal → **static bundle + AsyncStorage cache**

No feature should "accidentally" end up local-only because AsyncStorage happened to be easiest during prototyping. Each domain module must state its chosen persistence mode explicitly.

---

## Regional Identity Model

The following entities form the core regional data model. Canonical IDs must be defined before large-scale migration so display strings do not become permanent joins.

```
Country        id, name, iso2, dialCode, flag
Locality       id, name, countryId, type, parentLocalityId?, coordinates?, bounds?
Place          id, name, coordinates, category   ← coordinate-first, not locality-owned
ScamPattern    id, title, description, countryId, localityIds?, scamGroupId?, ...
ScamReport     id, patternId?, countryId, localityIds?, coordinates, ...
SafetyEntity   id, name, category, coordinates   ← hospital / police / embassy
Alert          id, countryId, source, severity, localityIds?, ...
```

### Key rules

- Scams may be country-wide, locality-specific, or both
- Reports should be geotagged (coordinates) where possible, not only display names
- Places and safety entities are coordinate-first — a hospital is not "owned" by a locality, it is near one
- Nearby queries use radius/bounding box logic, not single-city ownership
- `ScamGroup` links related or evolving patterns — the group is the stable reference; individual patterns within it are versioned instances

### Decision 12 — Canonical ID Policy

**Decided: hybrid semantic + opaque IDs. Stable world entities receive human-readable canonical IDs; authored, versioned, user-generated, or source-fed records receive opaque or source-native IDs.**

```text
If the thing is globally stable and human-recognisable -> semantic canonical ID
If the thing is authored, versioned, user-generated, or may fork -> opaque ID
```

| Entity | Canonical ID strategy | Example | Why |
|---|---|---|---|
| `Country` | ISO alpha-2 uppercase | `GB`, `TH`, `FR` | globally recognised, stable, portable |
| `Locality` | country id + slug | `GB-london`, `ID-bali`, `TH-khaosan-road` | readable, collision-safe across countries, flexible across cities, islands, regions, districts, and resort areas |
| `ScamGroup` | semantic slug | `tuk-tuk-overcharging` | concept-level grouping; useful for editorial continuity and admin reasoning |
| `ScamPattern` | UUID / opaque id | `pattern_...` | editorial records evolve, fork, and archive; title/content must not define identity |
| `ScamReport` | UUID / Firestore auto-id | opaque | user-generated event records; human readability adds no value |
| `Place` | provider-native id when external; opaque id when BSafe-owned | Google Place ID / opaque | preserve upstream identity where one exists |
| `SafetyEntity` | same as `Place` | provider id / opaque | coordinate-first real-world entity |
| `Alert` | source-native id when feed-sourced; opaque id when BSafe editorial | source id / opaque | preserves upstream deduplication for official feeds |
| personal user records | UUID / Firestore auto-id | opaque | mutable private records; no semantic ID value |

### ID invariants

- Display names, titles, and URL slugs may change; canonical IDs do not change once published.
- If a semantic ID later becomes linguistically awkward, preserve the ID and update the record fields rather than rewriting identity.
- Locality IDs use `countryId + slug`, not invented city abbreviations. A separate `shortCode` field may exist for display if useful, but it is not identity.
- `ScamGroup` carries semantic continuity; individual `ScamPattern` records remain opaque versioned instances within that history.

### Decision 13 — Locality Instead of a Fixed Region Layer

**Decided: model traveller-relevant places as flexible `Locality` records rather than forcing the world into a strict `Country → Region → City` hierarchy.**

The product needs to match how travellers actually think about place, not only formal administrative geography.

```text
AU-perth          type: city
ID-bali           type: island
ID-denpasar       type: city, parentLocalityId: ID-bali
TH-khaosan-road   type: district / area, parentLocalityId: TH-bangkok
```

A `Locality` can represent:

```ts
type LocalityType =
  | 'city'
  | 'island'
  | 'region'
  | 'district'
  | 'resort_area';
```

```ts
interface Locality {
  id: string;                    // country id + slug, e.g. ID-bali
  countryId: CountryId;
  name: string;
  type: LocalityType;
  parentLocalityId?: LocalityId;
  coordinates?: LatLng;
  bounds?: GeoBounds;
}
```

### Why

- `Perth` is usefully modelled as a city; `Bali` is not a city, but it is absolutely a first-class traveller context.
- A strict `Region` layer would be absent where unnecessary and insufficient where travellers care about islands, resort areas, or districts.
- A flexible locality model supports “Thailand scams”, “Bangkok scams”, “Khaosan Road scams”, “Indonesia scams”, and “Bali scams” without lying about what those places are.
- Parent-child links allow nested traveller contexts where useful, without requiring every country to have the same depth of hierarchy.

### Consequences

- Replace `CityId` as the general geographic attachment point with `LocalityId`; city remains a `Locality.type`, not the universal place concept.
- `ScamPattern` and `ScamReport` may attach to one or more `localityIds` as well as `countryId` and coordinates.
- Product search and filtering should surface localities according to traveller relevance, not assume all meaningful destinations are cities.
- Hospitals and safety entities remain coordinate-first; locality associations are a search/display aid, not rigid ownership.

### Still to decide

- **Many-to-many locality associations** — how to represent scams or alerts that span several localities or cross-border areas where proximity alone is insufficient.

---

## Admin Portal Responsibilities

The admin portal is the control plane for BSafe-managed content. v1 scope is defined in Decision 10.

Full eventual scope:

- Creating, editing, reviewing, publishing, unpublishing, and archiving content
- Attaching source metadata to factual claims before publish
- Review scheduling and stale-content visibility
- Moderation queues for ScamReport submissions
- Verification states for places and safety entities
- Mobile preview before publish
- Audit history (who changed what, when)
- Role-based access (operator vs super-admin)

v1 implements the first four. The rest follow from real usage patterns.

---

## Scam Report Abuse Vectors and Mitigations

Community submission creates specific abuse risks that must be designed for before launch.

| Abuse vector | Mitigation |
|---|---|
| **Business suppression** — a business floods the report queue with "false" reports about a competitor's scam warning, attempting to get it disputed/removed | `disputed` state requires admin review, not community vote. Volume of reports does not auto-change a Confirmed pattern. |
| **Coordinated false reports** — organised effort to seed fake scam reports in a region | AI spam/abuse score is the first gate. IP rate limiting + account age signals. Patterns require editorial review before publishing. |
| **Report bombing a legitimate business** — users submit scam reports targeting a legitimate venue | Reports are attached to scam types, not specific businesses by default. Pattern promotion requires editorial judgment. |
| **Data poisoning** — subtle misinformation introduced via many low-confidence reports | Auto-published reports are clearly labelled Reported (unreviewed). They cannot modify Confirmed content without human action. |
| **Reputation attacks** — scam reports for entire regions to deter tourism | Regional scope is attached to verified `CountryId`/`CityId` — reports without plausible coordinates have lower location confidence scores. |

---

## Initial Population Strategy

### Phase 1 — Seed from existing repo data

The BSafe repo contains useful seed datasets. These are migrated as **initial content**, not accepted as permanent truth without review.

Each imported dataset is tagged with:
- `sourceName: 'bsafe_legacy_repo'`
- `sourceType: 'editorial'`
- `confidence: 'medium'`
- `lastReviewedAt: <import date>`
- `nextReviewAt: <import date + 6 months>`

Already completed: 32 countries + 54 scams migrated to Firestore.

### Phase 2 — Normalise and verify

Before public reliance:
- Map all records onto canonical `CountryId` / `LocalityId`
- Merge duplicates
- Attach full source metadata
- Verify high-risk content first: emergency numbers, health guidance, legal claims, live alerts

### Phase 3 — Operate through admin workflows

After initial migration, all content changes flow through the admin portal. No direct Firestore console edits to published content. No ad hoc script changes without a migration record.

---

## Data Acquisition Roadmap

### Dependency chain

The following dependencies are load-bearing. Starting a later step before its predecessor is resolved will create rework:

```
A. Canonical ID format decided ✅
   └─► B. Admin portal can be built against stable IDs
         └─► C. Moderation queue is meaningful (reports attach to stable pattern IDs)
               └─► D. Build-time seed export produces a stable, re-importable snapshot
                     └─► E. App-start diff fetch works correctly against stable IDs
```

Specifically: if ID format changes after the admin portal ships, every document reference in Firestore, every bundled seed file, and every ScamReport-to-ScamPattern link becomes stale simultaneously. Resolve A before starting B.

### Steps

```
✅  1. Firestore content schema (V2) — designed
✅  2. Old repo datasets — inventoried
✅  3. Source strategy — decided per dataset (this document)
✅  4. Seed old data into Firestore — 32 countries + 54 scams done

✅  5. Decide canonical ID format — hybrid semantic + opaque policy (Decision 12)
⏳  6. Wikidata seed script for emergency numbers — run after ID format decided
⏳  7. ITU verification pass for top 40 countries — after Wikidata seed
⏳  8. Build admin portal v1 (5 screens + minimal audit trail) — BLOCKS step 9
⏳  9. Implement ScamReport submission in mobile app — BLOCKS step 10
⏳ 10. Implement AI triage Cloud Function — after ScamReport submission exists
⏳ 11. Connect official alert feeds (DFAT, FCO, State Dept) — independent
⏳ 12. Build-time seed export script + app-start diff fetch — after IDs stable
⏳ 13. Migrate packing list + medical card to Firestore
⏳ 14. Verify high-risk content (emergency numbers, health, laws) before public launch
⏳ 15. GDPR/CCPA data deletion flow — must exist before public launch
⏳ 16. Add community submission + moderation only after editorial workflows exist (step 8)
```

---

## Decision 15 — Source Attribution in the Mobile App

**Decided: the mobile app shows human-readable trust provenance; the admin portal stores full operational provenance.**

BSafe is a trust product. Source visibility is not ornamental — it helps users understand what kind of claim they are looking at. But the mobile UI should expose provenance in layers rather than dumping raw admin metadata onto every card.

### Attribution layers

```text
always visible        trust label / source type where it changes interpretation
available on demand   source name, last reviewed / updated, original source link where useful
admin only            reviewer identity, raw retrieval metadata, internal confidence mechanics, moderation notes
```

### User-facing attribution by dataset

| Dataset / claim | Mobile attribution rule |
|---|---|
| **Confirmed ScamPattern** | show **Confirmed by BSafe** + last reviewed date |
| **ScamReport** | show **Reported** + reviewed/unreviewed sub-signal |
| **Emergency number** | only high-confidence records are shown; optional lightweight “officially verified” cue, no medium-confidence numbers surfaced |
| **Local law** | show last reviewed date + expandable sources section |
| **Health guidance** | show last reviewed date + expandable sources section |
| **Official travel alert** | visibly name the source, e.g. `UK FCDO`, `US State Dept`, `DFAT` |
| **BSafe editorial alert** | visibly label as `BSafe editorial alert` |
| **Weather / currency** | show provider attribution where expected or contractually required; expose freshness where useful |
| **Places API results** | show third-party source framing, e.g. `Results from Google Places`; do not imply BSafe verification |

### Product rule

```text
Users should be able to understand why BSafe believes a claim without needing to read the admin record behind it.
```

The app should surface confidence first and detail second. Full reviewer identity, triage metadata, and operational provenance remain in the admin portal unless a later legal or product requirement says otherwise.

---

## Decision 16 — AI Triage Calibration Strategy

**Decided: design the scoring system now, keep thresholds configurable, and calibrate only after labelled real-world data exists.**

The triage pipeline should not pretend that numeric confidence thresholds can be chosen correctly before BSafe has real report data. The system architecture can be fixed now; the final routing thresholds must be learned from observed reports and moderator outcomes.

### Required triage output

```ts
interface ScamTriageResult {
  spamScore: number;
  patternMatchScore: number;
  severityScore: number;
  locationConfidenceScore: number;
  compositeConfidence: number;
  suggestedPatternId?: string;
  suggestedAction: 'reject' | 'auto_publish' | 'human_review';
  reasons: string[];
}
```

### Calibration rules

- All component scores, suggested actions, and explanation reasons are stored on each report.
- Thresholds are configuration, not hard-coded business logic.
- Calibration compares AI routing against eventual human moderator outcomes.
- The first proper threshold review happens after a sufficiently diverse labelled sample exists — target: first **500 real reports** or an equivalent representative reviewed dataset.
- Tuning should measure false positives, false negatives, spam escape rate, and whether category/region-specific thresholds are needed.

### Conservative launch posture

The system may support `auto_publish`, but BSafe should be willing to launch conservatively with:

```text
all reports -> human review
```

while silently collecting scores and moderator outcomes for calibration. Auto-publish becomes active only when evidence shows the routing is safe enough, not merely because the architecture can perform it.

---

## Decision 17 — Places Trust Layer Strategy

**Decided: v1 uses clearly attributed live provider results; future BSafe trust claims use a separate verification overlay rather than replacing the provider layer.**

Places data has two different jobs that must not be conflated:

```text
External Place result       = live utility data from a provider such as Google Places
BSafe SafetyEntity overlay  = optional BSafe-owned trust / verification record layered on top
```

### v1 model

```text
Nearby hospital from Google Places
Nearby police station from Google Places
Nearby embassy from Google Places
```

These may launch as useful nearby results if the provider source is clear and the app does not imply BSafe has independently verified them.

### Future hybrid model

When BSafe begins making stronger safety claims about a place, create a BSafe-owned overlay attached to a provider id and/or coordinates:

```ts
interface SafetyEntityOverlay {
  id: string;
  providerPlaceId?: string;
  coordinates: LatLng;
  status:
    | 'unverified'
    | 'provider_listed'
    | 'bsafe_reviewed'
    | 'community_flagged'
    | 'closed_or_invalid';
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}
```

### Likely promotion triggers

A place may warrant a BSafe overlay when it becomes more than a convenience result, for example:

- it appears in high-traffic or launch-priority localities
- it is surfaced in emergency flows
- users repeatedly correct or flag it
- official-source verification is available
- BSafe wants to call it a “safe zone” or otherwise make an editorial trust claim

### Product rule

```text
Provider listing is not BSafe verification.
BSafe verification is an additional layer, with its own metadata and lifecycle.
```

This lets the app ship useful nearby places early without blocking on full curation, while preserving a clean path to stronger trust claims later.

---

## Decision 14 — Public Launch Verification Bar

**Decided: verification requirements are based on the claim BSafe makes, not merely on whether a feature exists.**

A public launch does not require every useful dataset to reach the same standard. It does require that the app never imply a level of trust it has not earned.

```text
claim type                                  launch bar
------------------------------------------  ----------------------------------------------
BSafe says this is true / safe / confirmed   fully verified before launch
BSafe says users reported this               moderation / labelling required, not editorial proof
BSafe proxies a third-party live result      source must be clear; do not imply BSafe verification
```

### Must be verified before public launch

These datasets support high-trust or safety-critical claims and must meet their stated governance standard before being shown as authoritative:

| Dataset / claim | Required launch state |
|---|---|
| **Emergency numbers** | high-confidence / officially verified records only; unverified countries show no number |
| **ScamPatterns shown as Confirmed** | BSafe editorial review completed; source/review metadata present |
| **Local laws** | curated editorial review completed; source required; legal disclaimer visible |
| **Health guidance** | curated editorial review completed; source required; health disclaimer visible |
| **BSafe editorial alerts** | operator-reviewed; expiry date required; source/reason recorded |

### May launch with honest limitation or caveat

These may appear at launch where the product clearly communicates their lower or narrower trust level:

| Dataset / claim | Acceptable launch treatment |
|---|---|
| **ScamReports** | shown only as **Reported**, with reviewed/unreviewed sub-signal where applicable |
| **Emergency-number gaps** | show no unverified number; display guidance to verify with embassy/local authorities |
| **Sparse scam coverage by locality** | acceptable if absence of coverage is not presented as absence of risk |
| **Local apps / recommendations** | acceptable as curated utility content, not safety-critical truth |

### May launch as live third-party utility data

These datasets may launch without BSafe editorial verification where the source is explicit and the UI does not imply BSafe has independently verified the result:

| Dataset / claim | Required framing |
|---|---|
| **Weather** | live third-party data |
| **Currency rates** | live third-party data with freshness/caching semantics |
| **Tourist spots** | external/live results or recommendations, not safety claims |
| **Hospitals / police / embassies from Places API** | nearby third-party results, not “BSafe verified” safe zones |

### Special note: hospitals, police, embassies, safe zones

These entities feel safety-critical, but the launch bar depends on the wording:

```text
"Nearby hospitals from Google Places"       -> third-party live utility
"BSafe verified safe hospital"              -> verified editorial claim
```

The former can launch in v1 with clear source framing. The latter requires the future hybrid verification layer described elsewhere in this document.

### Consequence

Launch readiness should be assessed by **claim inventory**, not feature checklist. A feature may ship early if its truth posture is honest; a claim may not ship until its evidence bar is met.

---

## Legal and Liability Considerations

| Area | Requirement |
|---|---|
| Local laws content | Disclaimer on every screen; disclaimer in Terms of Service |
| Health guidance | Disclaimer on every screen; "consult a doctor" language in ToS |
| Emergency numbers | Unverified records (`confidence !== 'high'`) withheld from the app — country shows "not verified, contact your embassy" message. Only `confidence: 'high'` records displayed. No caveat-with-wrong-numbers approach. |
| Scam patterns | "For informational purposes; not legal accusation of any individual or business" language |
| Community reports | Reporter identity private by default; no PII in published reports; right to appeal rejection |
| Personal data (GDPR/CCPA) | Deletion flow defined in Decision 18; legal review and implementation required before public launch |
| Medical card data | Firestore owner-only rules; no third-party access; data export/delete option for user |

GDPR and CCPA compliance specifically requires a documented data deletion flow for all personal data. This must exist before public launch, even in minimal form.

---

## Open Decisions (Remaining)

All decisions resolved. See Decisions 1–18 above.

**One pre-launch action item** (not a design decision — an operational requirement):

| # | Action | Owner | Blocks |
|---|---|---|---|
| G | Legal review of Decision 18 — confirm jurisdiction-specific deletion wording, backup retention language, group-message policy, anonymised ScamReport de-identification standard, 30-day SLA achievability, and privacy policy / ToS language | Legal / product | Public launch |

---

## Decision 18 — Account Deletion and Personal Data Erasure Scope

**Decided: deleting an account deletes private user data and severs identity from public contributions; published scam-report content may remain as anonymised safety evidence.**

BSafe should not treat “delete account” as a vague support request. It is a product flow with an explicit data contract. The default rule is:

```text
Delete the person.
Preserve public safety knowledge only where it no longer identifies the person.
```

This is the initial product policy. It still requires legal review before public launch, especially around jurisdiction-specific exceptions, retention language, and backup handling.

### User-facing deletion flow

The app should provide a clear **Delete Account** action that:

1. explains what will be deleted and what anonymised contributions may remain
2. requires recent authentication / identity confirmation
3. immediately deactivates user access and revokes active sharing/session surfaces
4. schedules deletion of all account-owned cloud data through the cleanup workflow
5. clears local device data where the app can do so
6. deletes the Firebase Auth account last, after owned-data cleanup has been initiated successfully
7. confirms the request and states the deletion-completion window plainly, e.g. *"Your account is now deactivated. Your personal data will be deleted within 30 days."*

### Deletion scope by data class

| Data / record type | On account deletion | Rationale |
|---|---|---|
| Firebase Auth account | delete | account identity must cease to exist |
| user profile | delete | private personal data |
| trips / itinerary | delete | private personal data |
| packing lists | delete | private personal data |
| emergency contacts | delete | private personal data |
| medical card | delete | sensitive private personal data |
| friends / friend requests | delete or remove relationship edges | social graph should not retain the deleted user |
| group membership | remove user membership; preserve group if others remain | deleting one user should not destroy other users' group data |
| group messages | anonymise sender identity; retain message content in the group thread | deleting messages damages other users' conversations; ToS/privacy wording must explain that shared messages may remain but are no longer linked to the deleted user |
| widget configuration / theme / device preferences | clear local data | device-local personal preferences |
| travel documents | clear local data | local-only by current design |
| active location shares | delete / revoke immediately | live safety/privacy data must not persist after account deletion |
| historical location-share records | delete | personal location data |
| pending / rejected ScamReports | delete | no public value outweighing retention once user leaves |
| accepted / auto-published ScamReports | retain content, remove reporter identity | preserve public safety signal while deleting the person |
| ScamReports merged into ScamPatterns | retain anonymised provenance only; remove reporter identity | canonical editorial knowledge remains; user identity does not |
| ScamPatterns / editorial content | unchanged | BSafe-owned public content, not the user's personal data |

### Group-message retention rule

Group messages are shared conversational records, not private drafts. On account deletion:

- remove sender identity, profile references, and any direct link back to the deleted account
- preserve the message body in the conversation thread so other users' history is not silently damaged
- display retained messages as coming from a neutral deleted-user state, e.g. `Deleted user`
- explain this behaviour in the Terms of Service and privacy policy before launch

This is the default product policy unless later legal review requires a stricter jurisdiction-specific handling path.

### ScamReport anonymisation rule

When a retained public report survives account deletion:

- remove `userId`, display name, email, device identifiers, and any direct reporter references
- retain only the minimum content needed for the public safety purpose
- scrub free-text fields for self-identifying information where feasible before retention
- preserve moderation and merge history without preserving reporter identity
- future UI must not present the report as attributable to the deleted user

### Deletion timing and user communication

Deletion is an asynchronous operational workflow, not a promise of instantaneous physical erasure across every system.

- user access, active location sharing, and public account visibility should cease immediately
- owned active data should be deleted within **30 days** — aligned with the GDPR one-calendar-month response requirement and published as such in the privacy policy
- the UI must state that SLA explicitly rather than implying deletion is instant
- backups follow a documented rotation/retention schedule and must not be restored into active systems except under a documented disaster-recovery process

### Out-of-band erasure requests

The in-app deletion flow is not the only valid path. Before public launch, BSafe must provide an out-of-band erasure request route — for example `privacy@...` email and/or a web form — for users who no longer have app access, lost their device, forgot credentials, or cannot authenticate in-app.

That process must:

- trigger the same deletion/anonymisation workflow after identity verification
- be documented in the privacy policy
- be operationally trackable so requests are acknowledged and completed within the legally required response window

### Implementation notes

- Firestore document deletion is not recursive by default; deleting a parent user document does not automatically delete its subcollections. Account deletion requires explicit recursive cleanup of owned collections.
- Firebase Auth deletion can trigger automated cleanup workflows, but automation does not replace a documented deletion policy.
- AsyncStorage/local files should be cleared during in-app account deletion where possible; uninstalling the app is not a substitute for the product flow.
- Any third-party systems introduced later must be added to the deletion inventory before launch or integration.

### Legal review still required

The core product policy is now decided. Before public launch, legal/privacy review must confirm:

- jurisdiction-specific deletion exceptions and required wording
- backup retention language and confirmation that the 30-day deletion SLA is operationally achievable
- whether anonymised ScamReports meet the required standard of de-identification
- privacy-policy and Terms of Service language describing retained anonymised contributions and retained anonymised group messages
- wording and operating procedure for out-of-band erasure requests

---

## Definition of Done

BSafe's data system is mature enough for production when:

- Every production dataset has an explicit source strategy (this document provides that)
- Every publishable safety record supports provenance and review metadata
- The admin portal can manage the full lifecycle of BSafe-owned content
- Stale content is visible to operators rather than silently ignored
- User submissions do not bypass moderation into canonical truth
- Personal user data and public editorial data are clearly separated in both Firestore and code
- Storage ownership is explicit per domain (see inventory table above)
- The product can explain not only what it knows, but why it believes it
- A data deletion flow exists for all personal data before public launch
- Legal disclaimers are present on all law, health, and safety content

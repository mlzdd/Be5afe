# Data Platform Design

Last updated: 2026-05-17
Status: Design decisions made. Implementation-ready companion to DATA_ACQUISITION_GOVERNANCE.md.

---

## Purpose

This document covers the operational data engineering layer beneath the governance policy. Where
DATA_ACQUISITION_GOVERNANCE.md answers "what data, from where, and by whose authority," this document
answers "how does it actually work reliably at scale."

The eight topics covered:

1. Firestore collection model
2. Event model and audit log
3. Diff / export / tombstone protocol
4. Geospatial indexing
5. Schema versioning
6. Idempotency rules
7. PII classification
8. Analytics path

---

## 1. Firestore Collection Model

### Top-level collections

```
countries/{countryId}
localities/{localityId}
scamGroups/{groupId}
scamPatterns/{patternId}
scamReports/{reportId}
emergencyNumbers/{countryId}
alerts/{alertId}
healthGuides/{countryId}
localLaws/{countryId}
events/{eventId}                  ← append-only audit/event log; see section 2
users/{uid}
  /trips/{tripId}
  /packingList/{itemId}
  /emergencyContacts/{contactId}
  /medicalCard/default
  /locationShares/{shareId}
  /friends/{friendId}
friendRequests/{docId}
groups/{groupId}
  /messages/{messageId}
```

### Key structural rules

- Top-level collections are flat where possible. Deep nesting past two levels makes recursive deletion,
  querying, and export harder.
- `users/{uid}` subcollections hold all personal data. This single root makes account deletion scope
  unambiguous — all owned data lives under one path.
- Published editorial content (`scamPatterns`, `alerts`, `healthGuides`, `localLaws`) is never nested
  under `users/`. Personal data and public editorial data have separate roots.
- `events/` is a top-level append-only collection, not a subcollection of anything. Events must be
  queryable across entity types for calibration and audit.

### Document field conventions

Every BSafe-managed content document carries:

```ts
// Identity
id: string

// Provenance
sourceName: string
sourceUrl?: string
sourceType: 'official' | 'editorial' | 'api' | 'community'
confidence: 'high' | 'medium' | 'low'

// Lifecycle
status: string                  // entity-specific states; see governance doc
publishedAt?: string
expiresAt?: string
nextReviewAt: string

// Minimal audit trail (v1)
createdAt: string
updatedAt: string
updatedBy: string               // operator UID or system identifier
previousStatus: string

// Schema versioning
schemaVersion: number           // integer; see section 5
```

Personal user documents carry `createdAt` and `updatedAt` but do not need provenance or review fields.

---

## 2. Event Model and Audit Log

### Why events alongside mutable documents

Mutable Firestore documents record current state. They cannot answer:
- what was this record's history?
- why did this report get accepted rather than rejected?
- what did the AI triage say before the operator overrode it?
- which 500 reports should we use to calibrate the model?

An append-only event log answers all of these without replacing the mutable documents.

### Event collection

```
events/{eventId}
```

All events are written here. `eventId` is a Firestore auto-id (opaque, chronologically sortable via
`createdAt`).

### Event schema

```ts
interface BSafeEvent {
  id: string;
  type: EventType;
  entityType: 'ScamPattern' | 'ScamReport' | 'Alert' | 'EmergencyNumber' | 'HealthGuide' | 'LocalLaw' | 'User';
  entityId: string;
  actorId: string;              // operator UID, system identifier, or 'ai_triage'
  actorType: 'operator' | 'system' | 'user';
  createdAt: string;            // ISO timestamp; indexed
  payload: Record<string, unknown>;  // event-specific data; see event catalogue below
  schemaVersion: number;
}
```

### Event catalogue

```ts
type EventType =
  // ScamReport lifecycle
  | 'ScamReportSubmitted'
  | 'ScamReportTriaged'          // payload: ScamTriageResult
  | 'ScamReportAutoPublished'
  | 'ScamReportAccepted'
  | 'ScamReportRejected'         // payload: { reason: string }
  | 'ScamReportMarkedDuplicate'  // payload: { canonicalReportId: string }
  | 'ScamReportMerged'           // payload: { targetPatternId: string }

  // ScamPattern lifecycle
  | 'ScamPatternCreated'
  | 'ScamPatternPublished'
  | 'ScamPatternUpdated'         // payload: { changedFields: string[] }
  | 'ScamPatternFlaggedForReview'
  | 'ScamPatternDisputed'        // payload: { reason: string }
  | 'ScamPatternArchived'

  // Other editorial content
  | 'AlertPublished'
  | 'AlertArchived'
  | 'EmergencyNumberVerified'
  | 'EmergencyNumberUpdated'
  | 'ContentMarkedStale'

  // Account / personal data
  | 'AccountCreated'
  | 'AccountDeletionRequested'
  | 'AccountDeletionCompleted'
  | 'PersonalDataAnonymised'     // payload: { scope: string[] }
```

### Write rules

- Events are written by the same operation that mutates the document — not in a separate async step.
  If the document write fails, the event is not written. If both succeed, the system is consistent.
- Events are never updated or deleted except under a documented legal/compliance process.
- `AccountDeletionCompleted` and `PersonalDataAnonymised` events are retained permanently — they are
  the proof that deletion occurred, not personal data themselves.
- All other events referencing a deleted user have their `actorId` anonymised as part of the account
  deletion workflow.

### What v1 needs vs what comes later

**v1 (build now):** write events for all ScamReport and ScamPattern lifecycle transitions, and all
account deletion events. These are the minimum needed for moderation audit, AI calibration, and GDPR
compliance.

**v2:** extend event coverage to alerts, emergency numbers, and editorial content changes. Route events
to BigQuery for analytics (see section 8).

---

## 3. Diff / Export / Tombstone Protocol

### The problem with `updatedAt > bundleTimestamp` alone

A simple "fetch records newer than bundle date" query fails silently in two cases:

1. A record is **archived or unpublished** — its `updatedAt` changes but its content is removed from
   the app. A client that already has it in its bundle never learns to hide it.
2. A record is **physically deleted** — it no longer exists in Firestore. No query can return it.
   Clients with old bundles retain stale ghosts indefinitely.

### Solution: content manifest with tombstones

The diff protocol uses a manifest document rather than a raw timestamp query.

#### Manifest document

```
contentManifest/current
```

```ts
interface ContentManifest {
  exportVersion: number;          // monotonically incrementing integer
  exportedAt: string;             // ISO timestamp of last export
  schemaVersion: number;          // current schema version
  counts: {
    scamPatterns: number;
    alerts: number;
    emergencyNumbers: number;
    healthGuides: number;
    localLaws: number;
  };
  tombstones: TombstoneEntry[];   // records removed since previous export
}

interface TombstoneEntry {
  entityType: string;
  entityId: string;
  reason: 'archived' | 'unpublished' | 'deleted';
  tombstonedAt: string;
}
```

#### Diff fetch protocol (mobile app)

```
1. fetch contentManifest/current
2. if manifest.exportVersion === bundleExportVersion → nothing to do
3. if manifest.schemaVersion > app's known schemaVersion → flag for upgrade prompt
4. fetch records where updatedAt > lastSyncAt AND status == 'published'
5. apply tombstones from manifest:
     - hide / remove any entityId in tombstones list from local cache
6. write updated records to AsyncStorage
7. write new lastSyncAt and exportVersion to AsyncStorage
```

#### Tombstone retention

Tombstones accumulate in `contentManifest/current`. To prevent unbounded growth:
- tombstones older than **90 days** are pruned from the manifest on each export
- 90 days is a safe window because any app bundle older than 90 days will have been superseded by an
  app store update in practice; if an edge case requires longer, extend conservatively

#### Export version vs schema version

```
exportVersion   increments on every content change; used for diff detection
schemaVersion   increments only on breaking field changes; used for client compatibility
```

These are separate numbers. A content update does not change `schemaVersion`. A schema migration
increments `schemaVersion` and may or may not change `exportVersion`.

---

## 4. Geospatial Indexing

### Decision: geohash indexing on Firestore documents

Firestore does not support native radius queries. The standard approach is to encode coordinates as a
geohash string, index it, and query by prefix range.

### Geohash field convention

Any Firestore document with a physical location carries:

```ts
coordinates: { lat: number; lng: number };
geohash: string;   // encoded from coordinates; precision 9 by default (~5m cell)
```

`geohash` is computed at write time and stored alongside `coordinates`. It is derived data — never
the source of truth for coordinates, always recomputable.

### Query pattern

```ts
// Find documents within ~radius of a centre point
const bounds = geohashQueryBounds(centre, radiusMetres);
const queries = bounds.map(([start, end]) =>
  collection.where('geohash', '>=', start).where('geohash', '<=', end)
);
// merge results; filter false positives by haversine distance
```

### Where geohash is applied

| Entity | Needs geohash | Reason |
|---|---|---|
| `ScamReport` | yes | geo-proximity queries on the scam map |
| `SafetyEntity` (future BSafe-owned overlay) | yes | nearby safe zone queries |
| `Locality` | optional | bounds-based; geohash on `coordinates` centroid where useful |
| `ScamPattern` | no | attached to `localityIds`; locality carries the geo |
| `Alert` | no | country/locality-scoped; not coordinate-queried |
| `users/{uid}/locationShares` | yes | real-time proximity queries |

### What geohash does not replace

External place discovery (hospitals, police, embassies) continues to use the Google Places API, which
handles geospatial natively. Geohash indexing is only for BSafe-owned records in Firestore.

### Library

`geofire-common` (npm) — framework-agnostic geohash utilities used by both mobile app and server-side
scripts. Same encoding on both sides guarantees consistent prefix queries.

---

## 5. Schema Versioning

### Why it matters for bundled apps

Once a seed bundle ships inside an app binary, old readers are in the wild. If a schema change removes
a field that old code reads, or adds a required field that old code does not write, the app breaks
silently for users who have not updated.

### `schemaVersion` field

Every content document carries `schemaVersion: number`. The current schema version is also stored in
`contentManifest/current`.

### Version increment rules

```
patch change   add optional field, rename nothing, remove nothing   → no schemaVersion change
minor change   add required field with a safe default               → increment schemaVersion
major change   remove or rename a field; change a type              → increment schemaVersion + migration required
```

### Migration scripts

Schema migrations are scripts in `scripts/migrations/` following the naming convention:

```
scripts/migrations/
  001_add_geohash_to_reports.ts
  002_rename_cityId_to_localityId.ts
```

Each script:
- is idempotent — safe to rerun
- carries the `schemaVersion` it produces
- reads `schemaVersion` before writing and skips already-migrated documents
- writes a migration event to the `events/` collection on completion

### Backward compatibility window

The app must be able to read content documents one `schemaVersion` behind the current version. This
gives users who have not updated their app a working experience while an update propagates through the
app stores.

Content documents two or more versions behind the current schema are not guaranteed to be readable by
old clients. The `contentManifest` carries `schemaVersion` so the app can detect this and prompt for
an update rather than silently breaking.

### Seed bundle versioning

Each EAS build embeds:

```ts
const BUNDLE_EXPORT_VERSION = <number>;  // from contentManifest at build time
const BUNDLE_SCHEMA_VERSION = <number>;  // from contentManifest at build time
```

These constants are used in the diff fetch protocol to determine whether a sync is needed and whether
the client is compatible.

---

## 6. Idempotency Rules

### Why this matters

BSafe will have several write-producing operations that may run more than once:

- seed / migration scripts (rerun to add missing records)
- feed ingestors (DFAT, FCO, State Dept polled on a schedule)
- diff export scripts (run at build time and on content change)
- AI triage Cloud Functions (retried by Firebase on failure)
- moderation actions (operator double-submit, network retry)

Any operation that is not safe to rerun will eventually corrupt data or produce duplicate records.

### Natural key per entity type

Idempotency requires a stable natural key — a deterministic identifier that does not change on rerun.

| Entity | Natural key | Derivation |
|---|---|---|
| `Country` | ISO alpha-2 | e.g. `GB`, `TH` — globally canonical |
| `Locality` | `{countryId}-{slug}` | e.g. `TH-bangkok` — slug derived from name, stable |
| `ScamGroup` | semantic slug | e.g. `tuk-tuk-overcharging` — editorial choice, stable |
| `ScamPattern` | UUID assigned at creation | opaque; assigned once, never recomputed |
| `ScamReport` | UUID assigned at submission | opaque; assigned once by the submitting client |
| `EmergencyNumber` | `{countryId}` | one record per country |
| `Alert` (feed-sourced) | `{source}-{sourceNativeId}` | e.g. `dfat-TH-2025-04` — preserves upstream deduplication |
| `Alert` (BSafe editorial) | UUID assigned at creation | opaque |
| `HealthGuide` / `LocalLaw` | `{countryId}` | one record per country |

### Seed and migration script rules

```
1. derive the natural key for the record
2. check whether the document already exists at that key
3. if exists and content is identical → skip (no write, no event)
4. if exists and content differs → update (write, emit event)
5. if not exists → create (write, emit event)
```

Scripts must never blindly overwrite — they must read before writing.

### Feed ingestor rules

Feed-sourced alerts use `{source}-{sourceNativeId}` as the Firestore document ID. On each poll:

```
fetch feed → parse records → for each record:
  upsert document at {source}-{sourceNativeId}
  set lastFetchedAt = now()
  if content changed → emit AlertUpdated event
  if new → emit AlertPublished event
```

A record that disappears from the feed is **not automatically archived**. The ingestor flags it as
`lastSeenAt` past a threshold; a scheduled job then reviews and archives stale feed records.

### AI triage Cloud Function rules

Cloud Functions triggered by Firestore `onCreate` may fire more than once on retry. The triage function
must:

1. check whether `status !== 'submitted'` before processing — if already triaged, skip
2. write triage results and new status in a single atomic transaction
3. emit `ScamReportTriaged` event inside the same transaction

This guarantees exactly-once triage even if the function retries.

### Moderation action rules

Admin portal write operations must:

1. read the current document status before applying a state transition
2. reject the action if the document is already in the target state (idempotent no-op)
3. reject the action if the transition is not valid from the current state (invalid transition)
4. write the new status, audit fields, and event atomically

---

## 7. PII Classification

### Why field-level classification is needed

BSafe processes data that ranges from fully public (confirmed scam patterns) to highly sensitive
(medical card, live location). Without explicit classification:

- analytics exports may accidentally include personal data
- admin portal UI may expose fields that operators should not see
- deletion workflows may miss fields in free-text or derived data
- future regulatory requirements are harder to respond to without a data map

### Classification tiers

```
public            visible to any user; may be indexed or exported freely
internal          visible to BSafe operators; not user-facing; not exported to analytics without review
personal          belongs to an identified user; governed by retention and deletion rules
sensitive_personal  personal data with higher protection requirements (health, location, financial)
derived           computed from other fields; inherits the highest classification of its inputs
```

### Field-level classification map

#### ScamReport

| Field | Classification | Notes |
|---|---|---|
| `id` | internal | report exists, but identity is not public |
| `countryId`, `localityIds` | public | after accepted/auto-published |
| `coordinates` | sensitive_personal | precise location at time of report; anonymise on deletion |
| `geohash` | derived / sensitive_personal | derived from coordinates; same treatment |
| `title`, `description` | public | after accepted; scrub for PII before publish |
| `category`, `severity` | public | after accepted |
| `userId` | personal | remove on account deletion |
| `deviceId` | sensitive_personal | device-linked identifier; remove on account deletion |
| `status` | internal | |
| AI triage scores | internal | not user-facing; needed for calibration |
| `submittedAt` | internal | |

#### User personal data

| Field | Classification | Notes |
|---|---|---|
| `uid` | personal | Firebase Auth UID |
| `email` | personal | |
| `displayName` | personal | |
| Medical card fields | sensitive_personal | blood type, conditions, allergies, medications |
| Live location coordinates | sensitive_personal | delete / revoke immediately on account deletion |
| Historical location share records | sensitive_personal | delete on account deletion |
| Trip destinations, dates | personal | delete on account deletion |
| Emergency contacts | personal | delete on account deletion |

#### ScamPattern / editorial content

| Field | Classification | Notes |
|---|---|---|
| All content fields | public | BSafe-owned; no personal data |
| `updatedBy` | internal | operator identity; not user-facing |
| `reviewedBy` | internal | operator identity; not user-facing |

### Classification enforcement rules

1. Fields classified `sensitive_personal` must not appear in analytics exports without explicit
   anonymisation or aggregation.
2. Fields classified `personal` must be covered by the account deletion workflow in Decision 18.
3. Free-text fields in `ScamReport` that are promoted to public visibility must be reviewed for PII
   before the status change completes. This is an admin portal workflow requirement, not only a policy.
4. The `internal` classification means visible to BSafe operators in the admin portal, not to end
   users in the mobile app, and not exported to external systems without a documented purpose.
5. `derived` fields inherit the strictest classification of their source fields. `geohash` derived from
   precise coordinates is `sensitive_personal`, not merely `internal`.

---

## 8. Analytics Path

### Decision: BigQuery as the intended analytics sink; event log as the bridge

Firestore is the operational store. It is optimised for low-latency reads and writes per document.
It is not suited for:

- aggregate queries across thousands of reports
- moderation analytics (acceptance rate, spam escape rate, regional trends)
- AI triage calibration (comparing AI-suggested vs human-actual outcomes at scale)
- time-series trend analysis
- abuse pattern detection across accounts

BigQuery is the natural sink for this. Firebase has a native Firestore → BigQuery export integration
(Firebase Extensions: `firestore-bigquery-export`) that requires minimal custom infrastructure.

### Near-term: Firestore event log as analytical floor

BigQuery pipeline is not built yet. In the meantime, the `events/` collection in Firestore (section 2)
serves as the analytical floor:

- all ScamReport lifecycle transitions are queryable
- AI triage results are stored on each report
- moderation outcomes are stored as events
- the first 500 labelled reports for calibration come from this collection

This is sufficient for early-stage calibration and audit. It does not scale to long-term trend
analytics, but it does not need to yet.

### BigQuery integration path

When report volume or moderation analytics needs warrant it:

```
1. enable Firebase Extension: firestore-bigquery-export for the events/ collection
2. schedule nightly full exports for scamPatterns, scamReports, alerts
3. define BigQuery views for common analytical queries:
     - moderation_outcomes (AI routing vs human decision)
     - report_volume_by_region_week
     - pattern_staleness_report
     - abuse_signal_summary
4. connect BI tooling (Looker Studio / Data Studio is free with BigQuery)
```

No custom pipeline code is needed for the initial BigQuery integration — the Firebase extension handles
the export. Custom transforms live in BigQuery views, not in application code.

### What never goes to BigQuery

Fields classified `sensitive_personal` or `personal` must not appear in BigQuery exports without:
- explicit anonymisation applied before export
- documented retention policy for the warehouse copy
- access controls matching or stricter than the Firestore originals

This is a hard rule, not a default. The BigQuery schema for ScamReports excludes `userId`,
`deviceId`, `coordinates`, and `geohash`. Aggregated or geohash-prefix-level location data is
acceptable where it cannot be reverse-engineered to an individual.

---

## Operational Correctness Checklist

Before the first production data enters the system, the following must be true:

```
□  every content document has schemaVersion set
□  contentManifest/current exists and is maintained by the export script
□  tombstone entries are written when records are archived or unpublished
□  ScamReport and ScamPattern lifecycle events are written to events/ on every transition
□  AccountDeletionRequested and AccountDeletionCompleted events are written
□  AI triage Cloud Function is idempotent (re-checks status before processing)
□  seed and migration scripts use natural-key upsert pattern (no blind overwrites)
□  feed ingestors use source-native IDs as Firestore document IDs
□  geohash field is present on ScamReport, locationShares, and future SafetyEntity overlays
□  admin portal state-transition writes are atomic (status + audit fields + event in one transaction)
□  no sensitive_personal fields in the BigQuery export schema
□  30-day deletion SLA is operationally achievable given async cleanup workflow
```

This checklist is an implementation gate, not a post-launch audit. If any item is unchecked at
first production write, the system has a known correctness gap.

---

## Relationship to DATA_ACQUISITION_GOVERNANCE.md

| Concern | Lives in |
|---|---|
| What data, from where, by whose authority | GOVERNANCE |
| Trust tiers, review cadence, lifecycle states | GOVERNANCE |
| Scam pipeline, abuse mitigations, legal/deletion policy | GOVERNANCE |
| Firestore collection model, field conventions | PLATFORM (this doc) |
| Event model, audit log, tombstones | PLATFORM |
| Geospatial indexing, schema versioning | PLATFORM |
| Idempotency, natural keys, feed ingestor rules | PLATFORM |
| PII classification, analytics path | PLATFORM |

Neither document is complete without the other. The governance doc defines what is true and
trustworthy. This document defines how the system remains correct as data moves through it.

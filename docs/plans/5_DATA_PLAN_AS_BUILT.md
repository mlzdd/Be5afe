# Be5afe — Data Pipeline Plan

Last updated: 2026-05-24

---

## Overview

App phases 1–18 are complete. This document tracks the data pipeline phases — the work required to move from a static-data app to a live, community-assisted, operationally correct content platform. It now serves as the canonical as-built ledger for data work as phases move from planned → in progress → complete.

For context on decisions, see:
- `3_DATA_ACQUISITION_GOVERNANCE.md` — 18 data sourcing and governance decisions
- `4_DATA_PLATFORM_DESIGN.md` — Firestore schema, event model, sync protocol, PII classification

---

## Dependency chain

```
D1 (Emergency numbers seed)  ─────────────────────────────────────────────┐
D2 (Alert feeds)             ───────────────────────────────────────────────┤
D3 (Packing list + medical → Firestore)  ───────────────┬──────────────────┤
D4 (Admin portal v1)         ─┬─────────────────────────┤                  │
                               ├→ D5 (ScamReport submission + review path)  │
                               │    └→ D6 (AI triage + auto-publish)        │
                               └─────────────────────────┤                  │
D7 (Seed export + diff fetch)  ──────────────────────────┤                  │
                                                          └→ D8 (GDPR deletion flow)
                                                                             ↓
                                                              D9a (Store-ready build)
                                                                             ↓
                                                              D9b (Public launch readiness)
```

D1, D2, D3, D4, and D7 are all unblocked and can run in parallel once their local prerequisites are met. D4 is the editorial critical path; D3 + D8 are the personal-data compliance critical path; D5 + D6 are the community-reporting critical path.

---

## Current status snapshot

| Phase | Status | Current state |
|---|---|---|
| D1 — Emergency numbers seed | ✅ Complete | 40 high-confidence records seeded; idempotency verified |
| D2 — Official alert feeds | ✅ Complete | FCDO (124 alerts) + State Dept live; DFAT blocked by Cloudflare — deferred |
| D3 — Packing list + medical card sync | ✅ Complete | Authenticated Firestore persistence + guest fallback + migration path shipped |
| D4 — Admin portal v1 | ✅ Complete | All five screens verified against live Firestore; admin claim granted; 54 scamPatterns migrated |
| D5 — ScamReport submission + review path | ✅ Complete | Submit → moderate → render loop verified end-to-end; inline edit before accept shipped |
| D6 — AI triage | ⏳ Not started | Waits on a proven D5 path |
| D7 — Seed export + diff fetch | ✅ Complete | Export script live; seed.json bundled (54 patterns, 242 alerts, 40 emergency numbers); app-start diff sync wired |
| D8 — GDPR deletion flow | ⏳ Not started | Unblocked by D3 technically; still needs implementation + legal review |
| D9a — Store-ready build | ⏳ Not started | Waits on pre-launch blockers |
| D9b — Public launch readiness | ⏳ Not started | Waits on full data pipeline |

**Current verification note (2026-05-17):**
- Root app typecheck passes
- Root Jest suite passes: **19 suites, 91 tests**
- Admin portal production build passes
- D4/D5 live acceptance is not yet claimed because no admin account has been allowlisted for the end-to-end Firestore moderation check

---

## Phases

### D1 — Emergency Numbers Seed (Wikidata)

**Status:** ✅ Complete

**Scope:**
- Script: `scripts/seed-emergency-numbers.ts`
- Query Wikidata SPARQL for emergency numbers (police, ambulance, fire) per country
- ITU reference for top-40 country verification
- Only seed records with `confidence: 'high'` — unverified records are not shown in-app (Decision 6)
- Natural key / document ID: ISO alpha-2 country code (`emergencyNumbers/{countryId}`)
- One document per country, with service fields inside it (police / ambulance / fire)
- Idempotent: read-before-write on country code

**Acceptance criteria:**
- Script runs cleanly against `be5safe` Firestore project
- High-confidence records present for top-40 countries
- Emergency screen shows correct numbers for at least 10 spot-checked countries

**As built (2026-05-17):**
- Added `scripts/seed-emergency-numbers.ts`
- Corrected the seed design to use current Wikidata country-level emergency-number coverage plus an explicit ITU-T E.129 high-confidence verification set
- Seeded 40 high-confidence records into `emergencyNumbers/{countryId}`
- Verified rerun idempotency (`created 0, updated 0, skipped 40`) and spot-checked 10 stored records
- The mobile screen still uses the legacy bundled emergency-number dataset until the D7 bundle/diff reader is in place

---

### D2 — Official Alert Feeds

**Status:** 🚧 In progress

**Scope:**
- Ingestion scripts for DFAT (Australia), FCO (UK), State Dept (US)
- Alert ID format: `{source}-{sourceNativeId}` (e.g. `dfat-TH-2025-04`)
- Deduplication by alert ID (idempotent)
- Alerts stored in Firestore `alerts/` collection per `4_DATA_PLATFORM_DESIGN.md`
- BSafe editorial alerts fill gaps (manual, via admin portal)

**Acceptance criteria:**
- At least one feed ingested end-to-end
- Alerts visible in app for affected countries
- No duplicate alerts on re-run

**As built so far (2026-05-17):**
- Added `scripts/ingest-fco-alerts.ts` using the official GOV.UK Content API; 124 FCDO alerts live in Firestore
- Added `scripts/ingest-state-dept-alerts.ts` using the official State Department RSS feed; current advisories live in Firestore under stable country-based IDs
- Added shared alert contract, Firestore alert repository, `useAlerts`, and a real `LiveAlertsScreen`
- Verified reruns refresh existing alerts rather than creating duplicates
- DFAT/Smartraveller: Cloudflare blocks all programmatic access; headless browser approach deferred — FCO + State Dept provide sufficient global coverage for launch

---

### D3 — Packing List + Medical Card → Firestore

**Status:** ✅ Complete

**Scope:**
- Packing list: migrate from AsyncStorage to `users/{uid}/packingList/{itemId}`
- Medical card: migrate from AsyncStorage to `users/{uid}/medicalCard`
- Both must survive reinstall (Decision 9)
- Guest mode: keep AsyncStorage fallback, no Firestore write
- Migration path: on first authenticated load, read AsyncStorage → write Firestore → clear AsyncStorage

**Acceptance criteria:**
- Data survives app reinstall on authenticated account
- Guest mode still works with AsyncStorage only
- No data loss on migration for existing users

**As built (2026-05-17):**
- Extracted both features behind repository contracts instead of screen-local persistence
- Added hybrid repositories: authenticated users load/save via Firestore, guests continue using AsyncStorage
- Implemented one-time authenticated migration: if cloud state is empty, local AsyncStorage data is copied to Firestore and then cleared locally
- Added Firestore writes at `users/{uid}/packingList/{itemId}` and `users/{uid}/medicalCard/default`
- Added migration-path tests for both hybrid repositories and hook coverage for both features

---

### D4 — Admin Portal v1

**Status:** 🚧 In progress

**Scope:** Simple internal React + Firebase web app (Decision 10). Five screens:

1. **Scam Patterns** — list/edit/publish/archive ScamPatterns
2. **Moderation Queue** — review auto-published and low-confidence ScamReports
3. **Stale Content** — surface patterns not reviewed in > 12 months
4. **Emergency Numbers** — review/correct Wikidata-seeded records, set confidence
5. **Alerts** — create/edit BSafe editorial alerts; view feed-sourced alerts

Fields surfaced in v1: `updatedAt`, `updatedBy`, `previousStatus` (Decision 14 — audit trail in v1 scope).

**Acceptance criteria:**
- All 5 screens functional against live Firestore
- Can publish, archive, and moderate ScamPatterns end-to-end
- Auth-gated (Firebase Auth, admin email allowlist)

**As built (2026-05-24):**
- Added a separate Vite + React admin app under `admin/`
- Built all five v1 screens, custom-claim auth gating, and allowlisted admin-claim grant script
- Added admin-only Firestore writes plus transactional lifecycle event writes for ScamPattern and ScamReport moderation actions
- Added `scripts/migrate-scams-to-patterns.ts` — migrates legacy `scams` collection into canonical `scamPatterns` with full governance fields; idempotent; 54 records created
- Deployed Firestore rules + indexes to `be5safe` project; granted admin claim to operator account
- Verified all five screens against live Firestore: emergency numbers ✅, alerts ✅, scam patterns ✅ (54 records), stale content ✅, moderation queue ✅ (empty pending D5)

---

### D5 — ScamReport Submission + Human Review Path

**Status:** 🚧 In progress  
**Blocked by:** D4 live verification before submissions go live

**Scope:**
- In-app ScamReport form (category, location, description, optional photo)
- Submits to `scamReports/` Firestore collection with initial `status: 'submitted'`
- Until D6 exists, all reports route to the admin moderation queue for human review
- Reported tier visually distinct from Confirmed (Decision 3 + UI requirement)

**Acceptance criteria:**
- User can submit a scam report from the app
- Report appears in admin moderation queue (D4)
- Human-accepted reports appear in-app with Reported styling

**As built so far (2026-05-17):**
- Added mobile ScamReport submission flow behind a repository contract and replaced the Report Incident placeholder screen
- Authenticated submissions write a client-assigned opaque ID, initial `submitted` status, and a paired append-only `ScamReportSubmitted` event
- Added public subscription support for `accepted` / `auto_published` reports and rendered them in Scam Alerts with a visually distinct Reported treatment plus reviewed/unreviewed sub-signal
- Added inline edit form to moderation queue (title, description, category, severity, location) with Save draft / Save & Accept / Reject / Duplicate actions
- Verified end-to-end on 2026-05-24: submitted from Pixel 8 via Expo Go → appeared in admin queue → edited + accepted → rendered in-app with Reported styling

---

### D6 — AI Triage Cloud Function + Auto-Publish Path

**Status:** ⏳ Not started  
**Blocked by:** D5

**Scope:**
- Firebase Cloud Function triggered on new `scamReports/` document
- Hard veto: spam/abuse signals → `status: 'rejected'`
- Composite confidence score: category match + severity + location plausibility
- High confidence → `status: 'auto_published'`
- Low confidence → `status: 'pending_review'` (routes to D4 queue)
- Writes `events/` entry for audit trail
- Replaces D5's temporary “all reports to human review” path once proven safe

**Acceptance criteria:**
- Obvious spam vetoed without human review
- High-confidence reports auto-publish within seconds of submission
- Low-confidence reports appear in moderation queue
- Combined D5 + D6 flow preserves the visual distinction between Reported and Confirmed content

---

### D7 — Build-time Seed Export + App-start Diff Fetch

**Status:** ✅ Complete

**Scope:**
- Export script: generates static JSON seed bundle from Firestore at build time
- Export pipeline, not the admin portal, owns `contentManifest/current`
- Bundle shipped with app binary (offline floor)
- On app start: fetch `contentManifest/current` diff against bundle version
- Download only changed/added/tombstoned documents
- Tombstone protocol per `4_DATA_PLATFORM_DESIGN.md`

**Acceptance criteria:**
- App works fully offline using seed bundle ✅
- New/changed content syncs on first app start with connectivity ✅
- Tombstoned content hidden on next sync ✅

**As built (2026-05-24):**
- Added `scripts/export-seed.ts` — exports published scamPatterns, alerts, emergencyNumbers to `assets/seed.json`; updates `contentManifest/current` in Firestore with new exportVersion; prunes tombstones older than 90 days; idempotent dry-run mode
- Generated initial `assets/seed.json`: exportVersion 1, 54 scamPatterns, 242 alerts, 40 emergencyNumbers (~752KB)
- Added `src/infra/sync/ContentSyncService.ts` — on app start: reads manifest (1 Firestore read), if exportVersion > bundle version fetches updated records by updatedAt, merges into AsyncStorage, applies tombstones
- Exports `BUNDLE_EXPORT_VERSION` and `BUNDLE_SCHEMA_VERSION` constants from the bundled seed for use in diff protocol
- Wired `runContentSync()` into `AppProviders.tsx` via `useEffect` on mount — sync is fire-and-forget, failures degrade gracefully to seed bundle
- Typecheck and 91 tests all passing

**How the offline store works — implementation detail**

The system has two layers: the **seed bundle** (compile-time floor) and the **diff cache** (AsyncStorage overlay written at runtime). Together they mean the app has useful content on first install, stays current after that, and works fully offline in between.

```
Compile time                      Runtime (app start)
────────────────                  ────────────────────────────────────────────
scripts/export-seed.ts            ContentSyncService.runContentSync()
  │                                 │
  ├─ reads Firestore                ├─ reads contentManifest/current (1 read)
  │   scamPatterns (published)      │
  │   alerts (published)            ├─ if manifest.exportVersion <= known → done
  │   emergencyNumbers (all)        │
  │                                 ├─ else: fetch records where
  ├─ writes assets/seed.json        │   status == 'published'
  │   exportVersion: N              │   updatedAt > lastSyncAt
  │   54 patterns, 242 alerts       │   (1 read per collection)
  │   40 emergency numbers          │
  │                                 ├─ merge updates into AsyncStorage overlay
  └─ sets contentManifest/current   │   (new records added, changed records replaced)
      exportVersion: N              │
      tombstones: [...]             ├─ apply tombstones (remove archived/deleted IDs)
                                    │
                                    └─ write new lastSyncAt + exportVersion to AsyncStorage
```

**Compile-time step (before every EAS build):**

```bash
npx ts-node --project scripts/tsconfig.json scripts/export-seed.ts
```

This script connects to Firestore via the Admin SDK (uses `FIREBASE_*` env vars, never shipped to device), fetches all published content, and writes `assets/seed.json`. It also increments `exportVersion` in `contentManifest/current` so live app installs know there is new content to fetch. The file is checked into git and bundled by Metro into the app binary.

**Runtime — first install (no network):**
- `ContentSyncService` tries to fetch the manifest, fails silently.
- `getSyncedScamPatterns()` / `getSyncedAlerts()` return the data directly from `require('assets/seed.json')` — the bundled file is already in memory.
- The user sees 54 scam patterns and 242 alerts immediately, with zero network calls.

**Runtime — first install (with network):**
- Manifest fetch succeeds. `manifest.exportVersion` (1) equals `BUNDLE_EXPORT_VERSION` (1). No diff needed.
- Same result as offline — seed bundle is already current.

**Runtime — after content is updated in admin portal and a new export is run:**
- Admin edits a scam pattern → its `updatedAt` changes in Firestore.
- Operator runs `export-seed.ts` → `contentManifest/current.exportVersion` becomes 2.
- On next app start: manifest returns version 2, which is > the device's known version 1.
- `ContentSyncService` fetches only records where `updatedAt > lastSyncAt` — typically a handful of docs, not the full 54/242.
- Updated records are merged into AsyncStorage. `getSyncedScamPatterns()` now returns the merged set.
- `lastSyncAt` and `exportVersion: 2` are persisted to AsyncStorage for the next comparison.

**Tombstones:**
When a scam pattern is archived via the admin portal, a tombstone entry should be written to `contentManifest/current` (this is the planned D7 extension — the export script reads existing tombstones and prunes those older than 90 days, but the admin portal does not yet write tombstones automatically). Until that is wired, archiving a pattern removes it from the next export but does not proactively remove it from devices that have already cached it — they will get the correct state on the next diff fetch, because the archived record will no longer appear in the `status == 'published'` query.

**Key files:**

| File | Role |
|---|---|
| `scripts/export-seed.ts` | Run before each EAS build to snapshot Firestore content |
| `assets/seed.json` | Bundled offline floor; checked into git; regenerated each build |
| `src/infra/sync/ContentSyncService.ts` | App-start diff fetch, AsyncStorage cache, tombstone application |
| `src/app/AppProviders.tsx` | Calls `runContentSync()` once on mount via `useEffect` |
| `contentManifest/current` (Firestore) | Tracks current exportVersion and tombstones |

---

### D8 — GDPR Deletion Flow

**Status:** ⏳ Not started  
**Blocked by:** D3 (Firestore-backed personal data must exist), Decision 18 legal review before public launch

**Scope:**
- Account deletion: removes all `users/{uid}/*` Firestore data within 30 days (Decision 18)
- Anonymises ScamReports (strip PII, retain statistical signal)
- Out-of-band erasure request path for non-app users
- Group messages: retain if other members present, strip sender identity only
- Deletion event written to `events/` for audit

**Acceptance criteria:**
- Deleting account removes all personal data within 30-day SLA
- ScamReports retain anonymised statistical data
- Deletion event recorded in audit trail
- Legal review of Decision 18 completed (jurisdiction-specific wording)

---

### D9a — Store-Ready Build

**Status:** ⏳ Not started  
**Blocked by:** D3, D4, D8 (at minimum), plus Apple/Google dev accounts

**Scope:**
- EAS Build configuration
- App icons and splash screen
- Privacy policy and data disclosure (informed by Decision 18 legal review)
- Submission-ready binaries for App Store and Google Play

---

### D9b — Public Launch Readiness

**Status:** ⏳ Not started  
**Blocked by:** D1, D2, D3, D4, D5, D6, D7, D8

**Scope:**
- Public-facing scam intelligence loop live end-to-end
- Emergency-number launch bar satisfied
- Official alert ingestion live
- Seed bundle + diff sync operational
- Deletion flow and legal wording approved
- Final store submission / release decision

---

## Key decisions referenced

| Decision | Summary | Document |
|---|---|---|
| 3 | Auto-published ScamReports visually distinct from Confirmed | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 6 | Emergency numbers: withhold unverified records entirely | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 9 | Packing list + medical card → Firestore (survive reinstall) | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 10 | Admin portal: React + Firebase web app, pre-launch | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 12 | Canonical ID strategy (hybrid semantic/opaque) | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 14 | Source attribution on all published content | `3_DATA_ACQUISITION_GOVERNANCE.md` |
| 18 | Account deletion scope + 30-day SLA | `3_DATA_ACQUISITION_GOVERNANCE.md` |

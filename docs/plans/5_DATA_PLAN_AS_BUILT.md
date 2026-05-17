# Be5afe — Data Pipeline Plan

Last updated: 2026-05-17

---

## Overview

App phases 1–18 are complete. This document tracks the data pipeline phases — the work required to move from a static-data app to a live, community-assisted, operationally correct content platform. It is a forward plan, not an as-built record yet.

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

## Phases

### D1 — Emergency Numbers Seed (Wikidata)

**Status:** ⏳ Not started

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

---

### D2 — Official Alert Feeds

**Status:** ⏳ Not started

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

---

### D3 — Packing List + Medical Card → Firestore

**Status:** ⏳ Not started

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

---

### D4 — Admin Portal v1

**Status:** ⏳ Not started

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

---

### D5 — ScamReport Submission + Human Review Path

**Status:** ⏳ Not started  
**Blocked by:** D4 (moderation queue must exist before submissions go live)

**Scope:**
- In-app ScamReport form (category, location, description, optional photo)
- Submits to `scamReports/` Firestore collection with initial `status: 'submitted'`
- Until D6 exists, all reports route to the admin moderation queue for human review
- Reported tier visually distinct from Confirmed (Decision 3 + UI requirement)

**Acceptance criteria:**
- User can submit a scam report from the app
- Report appears in admin moderation queue (D4)
- Human-accepted reports appear in-app with Reported styling

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

**Status:** ⏳ Not started  
**Blocked by:** content schema stability; not blocked by the admin portal

**Scope:**
- Export script: generates static JSON seed bundle from Firestore at build time
- Export pipeline, not the admin portal, owns `contentManifest/current`
- Bundle shipped with app binary (offline floor)
- On app start: fetch `contentManifest/current` diff against bundle version
- Download only changed/added/tombstoned documents
- Tombstone protocol per `4_DATA_PLATFORM_DESIGN.md`

**Acceptance criteria:**
- App works fully offline using seed bundle
- New/changed content syncs on first app start with connectivity
- Tombstoned content hidden on next sync

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

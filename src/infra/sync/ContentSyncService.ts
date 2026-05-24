/**
 * D7 — app-start content sync.
 *
 * The seed bundle (assets/seed.json) is the offline floor shipped with the binary.
 * On each app start with network, this service:
 *   1. fetches contentManifest/current (1 Firestore read)
 *   2. if exportVersion is newer than the bundle/last-sync version, fetches
 *      updated documents and applies tombstones (1-3 more reads)
 *   3. writes results to AsyncStorage so they survive the session
 *
 * Callers use getScamPatterns() / getAlerts() / getEmergencyNumbers() which
 * merge the seed bundle with any cached diff data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@infra/database/firestore';

const KEYS = {
  syncMeta: '@be5afe_sync_meta',
  scamPatterns: '@be5afe_sync_scam_patterns',
  alerts: '@be5afe_sync_alerts',
  emergencyNumbers: '@be5afe_sync_emergency_numbers',
} as const;

interface SyncMeta {
  exportVersion: number;
  lastSyncAt: string;
}

interface TombstoneEntry {
  entityType: string;
  entityId: string;
  reason: 'archived' | 'unpublished' | 'deleted';
  tombstonedAt: string;
}

interface ContentManifest {
  exportVersion: number;
  exportedAt: string;
  schemaVersion: number;
  tombstones: TombstoneEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const seedBundle = require('../../../assets/seed.json') as {
  exportVersion: number;
  exportedAt: string;
  schemaVersion: number;
  scamPatterns: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  emergencyNumbers: Record<string, unknown>[];
};

export const BUNDLE_EXPORT_VERSION: number = seedBundle.exportVersion;
export const BUNDLE_SCHEMA_VERSION: number = seedBundle.schemaVersion;

async function readSyncMeta(): Promise<SyncMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.syncMeta);
    return raw ? (JSON.parse(raw) as SyncMeta) : null;
  } catch {
    return null;
  }
}

async function writeSyncMeta(meta: SyncMeta): Promise<void> {
  await AsyncStorage.setItem(KEYS.syncMeta, JSON.stringify(meta));
}

async function readCachedItems<T>(key: string): Promise<T[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

async function writeCachedItems<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

function applyTombstones<T extends { id: string }>(
  items: T[],
  tombstones: TombstoneEntry[],
  entityType: string,
): T[] {
  const removedIds = new Set(
    tombstones.filter((t) => t.entityType === entityType).map((t) => t.entityId),
  );
  return items.filter((item) => !removedIds.has(item.id));
}

async function fetchUpdatedDocs(
  collectionName: string,
  lastSyncAt: string,
): Promise<Record<string, unknown>[]> {
  if (!db) return [];
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where('status', '==', 'published'),
      where('updatedAt', '>', lastSyncAt),
    ),
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function mergeUpdates<T extends Record<string, unknown>>(
  existing: T[],
  updates: T[],
): Promise<T[]> {
  if (updates.length === 0) return existing;
  const map = new Map(existing.map((item) => [item['id'] as string, item]));
  for (const update of updates) {
    map.set(update['id'] as string, update);
  }
  return Array.from(map.values());
}

/**
 * Run on app start. Silently no-ops if Firestore is unavailable or the
 * bundle is already up to date. Never throws — sync failures degrade
 * gracefully to the seed bundle.
 */
export async function runContentSync(): Promise<void> {
  if (!db) return;

  try {
    const manifestSnap = await getDoc(doc(db, 'contentManifest', 'current'));
    if (!manifestSnap.exists()) return;
    const manifest = manifestSnap.data() as ContentManifest;

    const meta = await readSyncMeta();
    const currentVersion = meta?.exportVersion ?? BUNDLE_EXPORT_VERSION;

    if (manifest.exportVersion <= currentVersion) return;

    const lastSyncAt = meta?.lastSyncAt ?? seedBundle.exportedAt;

    // Fetch updated records in parallel
    const [updatedPatterns, updatedAlerts] = await Promise.all([
      fetchUpdatedDocs('scamPatterns', lastSyncAt),
      fetchUpdatedDocs('alerts', lastSyncAt),
    ]);

    // Load existing cached items (or seed bundle as base)
    const [cachedPatterns, cachedAlerts] = await Promise.all([
      readCachedItems<Record<string, unknown>>(KEYS.scamPatterns),
      readCachedItems<Record<string, unknown>>(KEYS.alerts),
    ]);

    const basePatterns = cachedPatterns ?? (seedBundle.scamPatterns as Record<string, unknown>[]);
    const baseAlerts = cachedAlerts ?? (seedBundle.alerts as Record<string, unknown>[]);

    // Merge updates
    let mergedPatterns = await mergeUpdates(basePatterns, updatedPatterns as Record<string, unknown>[]);
    let mergedAlerts = await mergeUpdates(baseAlerts, updatedAlerts as Record<string, unknown>[]);

    // Apply tombstones
    mergedPatterns = applyTombstones(mergedPatterns as (Record<string, unknown> & { id: string })[], manifest.tombstones, 'ScamPattern') as Record<string, unknown>[];
    mergedAlerts = applyTombstones(mergedAlerts as (Record<string, unknown> & { id: string })[], manifest.tombstones, 'Alert') as Record<string, unknown>[];

    // Persist
    const now = new Date().toISOString();
    await Promise.all([
      writeCachedItems(KEYS.scamPatterns, mergedPatterns),
      writeCachedItems(KEYS.alerts, mergedAlerts),
      writeSyncMeta({ exportVersion: manifest.exportVersion, lastSyncAt: now }),
    ]);
  } catch (err) {
    // Sync failure is non-fatal — app falls back to seed bundle
    if (__DEV__) {
      console.warn('[ContentSync] sync failed, using seed bundle:', err);
    }
  }
}

/**
 * Returns scam patterns: cached diff overlay on top of seed bundle, or seed bundle alone.
 */
export async function getSyncedScamPatterns(): Promise<Record<string, unknown>[]> {
  const cached = await readCachedItems<Record<string, unknown>>(KEYS.scamPatterns);
  return cached ?? (seedBundle.scamPatterns as Record<string, unknown>[]);
}

/**
 * Returns alerts: cached diff overlay on top of seed bundle, or seed bundle alone.
 */
export async function getSyncedAlerts(): Promise<Record<string, unknown>[]> {
  const cached = await readCachedItems<Record<string, unknown>>(KEYS.alerts);
  return cached ?? (seedBundle.alerts as Record<string, unknown>[]);
}

/**
 * Returns emergency numbers from the seed bundle (no diff fetch needed — these
 * change infrequently and are managed via admin portal + manual seed runs).
 */
export async function getSyncedEmergencyNumbers(): Promise<Record<string, unknown>[]> {
  const cached = await readCachedItems<Record<string, unknown>>(KEYS.emergencyNumbers);
  return cached ?? (seedBundle.emergencyNumbers as Record<string, unknown>[]);
}

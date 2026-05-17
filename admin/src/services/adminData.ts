import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Alert, EmergencyNumber, ScamPattern, ScamReport } from '../types';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

export async function listScamPatterns(): Promise<ScamPattern[]> {
  const snapshot = await getDocs(collection(requireDb(), 'scamPatterns'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ScamPattern));
}

export async function listModerationQueue(): Promise<ScamReport[]> {
  const snapshot = await getDocs(
    query(
      collection(requireDb(), 'scamReports'),
      where('status', 'in', ['submitted', 'pending_review', 'auto_published']),
    ),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ScamReport));
}

export async function listStalePatterns(): Promise<ScamPattern[]> {
  const snapshot = await getDocs(
    query(
      collection(requireDb(), 'scamPatterns'),
      where('nextReviewAt', '<', nowIso()),
    ),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ScamPattern));
}

export async function listEmergencyNumbers(): Promise<EmergencyNumber[]> {
  const snapshot = await getDocs(collection(requireDb(), 'emergencyNumbers'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as EmergencyNumber));
}

export async function listAlerts(): Promise<Alert[]> {
  const snapshot = await getDocs(collection(requireDb(), 'alerts'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Alert));
}

export async function transitionPattern(
  patternId: string,
  nextStatus: ScamPattern['status'],
  actorId: string,
): Promise<void> {
  const database = requireDb();
  await runTransaction(database, async (transaction) => {
    const ref = doc(database, 'scamPatterns', patternId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Pattern not found');
    const current = snapshot.data() as ScamPattern;
    if (current.status === nextStatus) return;

    transaction.update(ref, {
      status: nextStatus,
      updatedAt: nowIso(),
      updatedBy: actorId,
      previousStatus: current.status,
    });
    transaction.set(doc(collection(database, 'events')), {
      type: nextStatus === 'archived' ? 'ScamPatternArchived' : 'ScamPatternPublished',
      entityType: 'ScamPattern',
      entityId: patternId,
      actorId,
      actorType: 'operator',
      createdAt: nowIso(),
      payload: { previousStatus: current.status, nextStatus },
      schemaVersion: 1,
    });
  });
}

export async function updatePatternFields(
  patternId: string,
  updates: Partial<Pick<ScamPattern, 'title' | 'countryId' | 'nextReviewAt'>>,
  actorId: string,
): Promise<void> {
  await updateDoc(doc(requireDb(), 'scamPatterns', patternId), {
    ...updates,
    updatedAt: nowIso(),
    updatedBy: actorId,
  });
}

export async function moderateReport(
  reportId: string,
  nextStatus: Extract<ScamReport['status'], 'accepted' | 'rejected' | 'duplicate'>,
  actorId: string,
): Promise<void> {
  const database = requireDb();
  await runTransaction(database, async (transaction) => {
    const ref = doc(database, 'scamReports', reportId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Report not found');
    const current = snapshot.data() as ScamReport;
    if (current.status === nextStatus) return;

    transaction.update(ref, {
      status: nextStatus,
      updatedAt: nowIso(),
      updatedBy: actorId,
      previousStatus: current.status,
    });
    transaction.set(doc(collection(database, 'events')), {
      type:
        nextStatus === 'accepted'
          ? 'ScamReportAccepted'
          : nextStatus === 'duplicate'
            ? 'ScamReportMarkedDuplicate'
            : 'ScamReportRejected',
      entityType: 'ScamReport',
      entityId: reportId,
      actorId,
      actorType: 'operator',
      createdAt: nowIso(),
      payload: { previousStatus: current.status, nextStatus },
      schemaVersion: 1,
    });
  });
}

export async function updateEmergencyNumber(
  countryId: string,
  updates: Pick<EmergencyNumber, 'police' | 'ambulance' | 'fire' | 'confidence'>,
  actorId: string,
): Promise<void> {
  await updateDoc(doc(requireDb(), 'emergencyNumbers', countryId), {
    ...updates,
    updatedAt: nowIso(),
    updatedBy: actorId,
    previousStatus: 'published',
  });
}

export async function createEditorialAlert(
  input: Omit<Alert, 'id' | 'source' | 'status'>,
  actorId: string,
): Promise<void> {
  if (!input.expiresAt) throw new Error('Editorial alerts require an expiry date');

  await addDoc(collection(requireDb(), 'alerts'), {
    ...input,
    source: 'bsafe_editorial',
    sourceName: 'BSafe editorial',
    sourceType: 'editorial',
    confidence: 'high',
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: nowIso(),
    updatedBy: actorId,
    previousStatus: 'draft',
    schemaVersion: 1,
  });
}

export async function transitionEditorialAlert(
  alertId: string,
  nextStatus: Extract<Alert['status'], 'published' | 'archived'>,
  actorId: string,
): Promise<void> {
  const database = requireDb();
  await runTransaction(database, async (transaction) => {
    const ref = doc(database, 'alerts', alertId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Alert not found');
    const current = snapshot.data() as Alert;
    if (current.source !== 'bsafe_editorial') throw new Error('Only editorial alerts can be transitioned here');
    if (current.status === nextStatus) return;

    transaction.update(ref, {
      status: nextStatus,
      updatedAt: nowIso(),
      updatedBy: actorId,
      previousStatus: current.status,
    });
  });
}

export async function updateEditorialAlert(
  alertId: string,
  updates: Partial<Pick<Alert, 'title' | 'summary' | 'body' | 'expiresAt'>>,
  actorId: string,
): Promise<void> {
  await updateDoc(doc(requireDb(), 'alerts', alertId), {
    ...updates,
    updatedAt: nowIso(),
    updatedBy: actorId,
  });
}

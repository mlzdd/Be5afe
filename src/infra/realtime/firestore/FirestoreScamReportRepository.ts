import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@infra/database/firestore';
import type { ScamReportRepository } from '@shared/contracts/ScamReportRepository';
import type { CreateScamReportInput, ScamReport } from '@products/bsafe/scam-reports/types';

function requireDb() {
  if (!db) throw new Error('Firestore not initialised');
  return db;
}

export class FirestoreScamReportRepository implements ScamReportRepository {
  subscribeToVisibleReports(callback: (reports: ScamReport[]) => void): () => void {
    if (!db) {
      callback([]);
      return () => {};
    }

    const reportsQuery = query(
      collection(db, 'scamReports'),
      where('status', 'in', ['accepted', 'auto_published']),
    );

    return onSnapshot(reportsQuery, (snapshot) => {
      const reports = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() } as ScamReport))
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      callback(reports);
    });
  }

  async submitReport(userId: string, input: CreateScamReportInput): Promise<string> {
    const database = requireDb();
    const reportRef = doc(collection(database, 'scamReports'));
    const now = new Date().toISOString();
    const report: ScamReport = {
      id: reportRef.id,
      title: input.title,
      category: input.category,
      description: input.description,
      countryId: input.countryId,
      countryName: input.countryName,
      localityIds: input.localityIds ?? [],
      status: 'submitted',
      severity: input.severity,
      userId,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      ...(input.localityText ? { localityText: input.localityText } : {}),
      ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
    };

    const batch = writeBatch(database);
    batch.set(reportRef, report);
    batch.set(doc(database, 'events', `ScamReportSubmitted_${reportRef.id}`), {
      type: 'ScamReportSubmitted',
      entityType: 'ScamReport',
      entityId: reportRef.id,
      actorId: userId,
      actorType: 'user',
      createdAt: now,
      payload: { countryId: input.countryId, severity: input.severity },
      schemaVersion: 1,
    });
    await batch.commit();
    return reportRef.id;
  }
}

import { useEffect, useState } from 'react';
import { listModerationQueue, moderateReport } from '../services/adminData';
import { StatusBadge } from '../components/StatusBadge';
import type { ScamReport } from '../types';

export function ModerationQueuePage({ actorId }: { actorId: string }) {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const refresh = () => listModerationQueue().then(setReports);
  useEffect(() => { void refresh(); }, []);

  return (
    <section>
      <h2>Moderation Queue</h2>
      <table>
        <thead><tr><th>Report</th><th>Country</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.title ?? report.description ?? report.id}</td>
              <td>{report.countryId ?? '—'}</td>
              <td><StatusBadge label={report.status} /></td>
              <td>
                <button onClick={() => moderateReport(report.id, 'accepted', actorId).then(refresh)}>Accept</button>
                <button onClick={() => moderateReport(report.id, 'rejected', actorId).then(refresh)}>Reject</button>
                <button onClick={() => moderateReport(report.id, 'duplicate', actorId).then(refresh)}>Duplicate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import {
  createEditorialAlert,
  listAlerts,
  transitionEditorialAlert,
  updateEditorialAlert,
} from '../services/adminData';
import { StatusBadge } from '../components/StatusBadge';
import type { Alert } from '../types';

const EMPTY = {
  countryId: '',
  countryName: '',
  severity: 'advisory' as Alert['severity'],
  title: '',
  summary: '',
  body: '',
  expiresAt: '',
};

export function AlertsPage({ actorId }: { actorId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [draft, setDraft] = useState(EMPTY);
  const refresh = () => listAlerts().then(setAlerts);
  useEffect(() => { void refresh(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createEditorialAlert(draft, actorId);
    setDraft(EMPTY);
    await refresh();
  }

  return (
    <section>
      <h2>Alerts</h2>
      <form onSubmit={submit} className="editorial-form">
        <h3>Create editorial alert</h3>
        <input placeholder="Country ID" value={draft.countryId} onChange={(e) => setDraft({ ...draft, countryId: e.target.value })} />
        <input placeholder="Country name" value={draft.countryName} onChange={(e) => setDraft({ ...draft, countryName: e.target.value })} />
        <input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <textarea placeholder="Body" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        <input type="date" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
        <button type="submit">Create draft</button>
      </form>
      <table>
        <thead><tr><th>Title</th><th>Country</th><th>Source</th><th>Status</th><th /></tr></thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{alert.title}</td>
              <td>{alert.countryName}</td>
              <td>{alert.source}</td>
              <td><StatusBadge label={alert.status} /></td>
              <td>
                {alert.source === 'bsafe_editorial' && (
                  <>
                    <button
                      onClick={() => {
                        const title = window.prompt('Alert title', alert.title);
                        const body = window.prompt('Alert body', alert.body);
                        const expiresAt = window.prompt('Expiry date', alert.expiresAt ?? '');
                        if (title && body && expiresAt) {
                          void updateEditorialAlert(alert.id, { title, body, expiresAt }, actorId).then(refresh);
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button onClick={() => transitionEditorialAlert(alert.id, 'published', actorId).then(refresh)}>Publish</button>
                    <button onClick={() => transitionEditorialAlert(alert.id, 'archived', actorId).then(refresh)}>Archive</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

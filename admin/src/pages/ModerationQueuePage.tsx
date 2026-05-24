import { useEffect, useState } from 'react';
import { listModerationQueue, moderateReport, updateReportFields } from '../services/adminData';
import { StatusBadge } from '../components/StatusBadge';
import type { ScamReport } from '../types';

const CATEGORIES = [
  'taxi_overcharge', 'fake_police', 'gem_scam', 'friendship_scam', 'temple_scam',
  'atm_skimming', 'counterfeit_goods', 'tour_scam', 'accommodation_scam', 'other',
];

const SEVERITIES = ['low', 'medium', 'high'] as const;

interface EditState {
  title: string;
  description: string;
  category: string;
  severity: string;
  localityText: string;
}

function toEditState(report: ScamReport): EditState {
  return {
    title: report.title ?? '',
    description: report.description ?? '',
    category: report.category ?? '',
    severity: report.severity ?? 'medium',
    localityText: report.localityText ?? '',
  };
}

function ReportDetail({
  report,
  actorId,
  onDone,
}: {
  report: ScamReport;
  actorId: string;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<EditState>(toEditState(report));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof EditState, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateReportFields(report.id, draft, actorId);
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveAndAccept() {
    setSaving(true);
    setError(null);
    try {
      await updateReportFields(report.id, draft, actorId);
      await moderateReport(report.id, 'accepted', actorId);
      onDone();
    } catch {
      setError('Accept failed');
    } finally {
      setSaving(false);
    }
  }

  async function reject() {
    setSaving(true);
    setError(null);
    try {
      await moderateReport(report.id, 'rejected', actorId);
      onDone();
    } catch {
      setError('Reject failed');
    } finally {
      setSaving(false);
    }
  }

  async function markDuplicate() {
    setSaving(true);
    setError(null);
    try {
      await moderateReport(report.id, 'duplicate', actorId);
      onDone();
    } catch {
      setError('Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td colSpan={5} style={{ background: '#f8f8f8', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Title</span>
            <input value={draft.title} onChange={(e) => set('title', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Location</span>
            <input value={draft.localityText} onChange={(e) => set('localityText', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Category</span>
            <select value={draft.category} onChange={(e) => set('category', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">— select —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Severity</span>
            <select value={draft.severity} onChange={(e) => set('severity', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#666' }}>Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={save} disabled={saving}>Save draft</button>
          <button onClick={saveAndAccept} disabled={saving} style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}>
            Save &amp; Accept
          </button>
          <button onClick={reject} disabled={saving} style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}>
            Reject
          </button>
          <button onClick={markDuplicate} disabled={saving} style={{ color: '#666' }}>
            Duplicate
          </button>
          {error && <span style={{ color: 'red', fontSize: '13px' }}>{error}</span>}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
            Submitted: {report.submittedAt ?? '—'}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function ModerationQueuePage({ actorId }: { actorId: string }) {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const refresh = () => listModerationQueue().then(setReports);
  useEffect(() => { void refresh(); }, []);

  return (
    <section>
      <h2>Moderation Queue</h2>
      <table>
        <thead>
          <tr><th>Report</th><th>Country</th><th>Severity</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <>
              <tr
                key={report.id}
                style={{ cursor: 'pointer', background: expanded === report.id ? '#f0f0f0' : undefined }}
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <td>{report.title ?? report.id} {expanded === report.id ? '▲' : '▼'}</td>
                <td>{report.countryName ?? report.countryId ?? '—'}</td>
                <td>{report.severity ?? '—'}</td>
                <td><StatusBadge label={report.status} /></td>
                <td />
              </tr>
              {expanded === report.id && (
                <ReportDetail
                  key={`${report.id}-detail`}
                  report={report}
                  actorId={actorId}
                  onDone={() => { setExpanded(null); void refresh(); }}
                />
              )}
            </>
          ))}
        </tbody>
      </table>
    </section>
  );
}

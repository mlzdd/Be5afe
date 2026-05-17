import { useEffect, useState } from 'react';
import { listScamPatterns, transitionPattern, updatePatternFields } from '../services/adminData';
import { StatusBadge } from '../components/StatusBadge';
import type { ScamPattern } from '../types';

export function ScamPatternsPage({ actorId }: { actorId: string }) {
  const [patterns, setPatterns] = useState<ScamPattern[]>([]);

  const refresh = () => listScamPatterns().then(setPatterns);
  useEffect(() => { void refresh(); }, []);

  return (
    <section>
      <h2>Scam Patterns</h2>
      <table>
        <thead><tr><th>Title</th><th>Country</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {patterns.map((pattern) => (
            <tr key={pattern.id}>
              <td>{pattern.title ?? pattern.id}</td>
              <td>{pattern.countryId ?? '—'}</td>
              <td><StatusBadge label={pattern.status} /></td>
              <td>
                <button
                  onClick={() => {
                    const title = window.prompt('Pattern title', pattern.title ?? '');
                    if (title !== null) void updatePatternFields(pattern.id, { title }, actorId).then(refresh);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => transitionPattern(pattern.id, 'published', actorId).then(refresh)}>Publish</button>
                <button onClick={() => transitionPattern(pattern.id, 'archived', actorId).then(refresh)}>Archive</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

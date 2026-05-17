import { useEffect, useState } from 'react';
import { listStalePatterns } from '../services/adminData';
import type { ScamPattern } from '../types';

export function StaleContentPage() {
  const [patterns, setPatterns] = useState<ScamPattern[]>([]);
  useEffect(() => { void listStalePatterns().then(setPatterns); }, []);

  return (
    <section>
      <h2>Stale Content</h2>
      <table>
        <thead><tr><th>Pattern</th><th>Country</th><th>Next review due</th></tr></thead>
        <tbody>
          {patterns.map((pattern) => (
            <tr key={pattern.id}>
              <td>{pattern.title ?? pattern.id}</td>
              <td>{pattern.countryId ?? '—'}</td>
              <td>{pattern.nextReviewAt ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

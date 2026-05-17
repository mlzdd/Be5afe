import type { ReactNode } from 'react';

export type AdminPage = 'patterns' | 'moderation' | 'stale' | 'emergency' | 'alerts';

const NAV: Array<{ key: AdminPage; label: string }> = [
  { key: 'patterns', label: 'Scam Patterns' },
  { key: 'moderation', label: 'Moderation Queue' },
  { key: 'stale', label: 'Stale Content' },
  { key: 'emergency', label: 'Emergency Numbers' },
  { key: 'alerts', label: 'Alerts' },
];

export function Shell({
  activePage,
  onNavigate,
  children,
}: {
  activePage: AdminPage;
  onNavigate(page: AdminPage): void;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside>
        <h1>Be5afe Admin</h1>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.key}
              className={item.key === activePage ? 'active' : ''}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}

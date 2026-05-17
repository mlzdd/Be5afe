export function StatusBadge({ label }: { label: string }) {
  return <span className={`badge badge-${label}`}>{label.replaceAll('_', ' ')}</span>;
}

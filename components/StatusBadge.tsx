import { ReclamationStatus } from '@/lib/types';

const config: Record<ReclamationStatus, { label: string; color: string; icon: string }> = {
  OUVERTE:  { label: 'Ouverte',   color: '#1565C0', icon: '◎' },
  EN_COURS: { label: 'En cours',  color: '#E65100', icon: '⟳' },
  RESOLUE:  { label: 'Résolue',   color: '#2E7D32', icon: '✓' },
  REJETEE:  { label: 'Rejetée',   color: '#757575', icon: '✕' },
};

export function StatusBadge({ status }: { status: ReclamationStatus }) {
  const { label, color, icon } = config[status];
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide"
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1.5px solid ${color}35`,
      }}>
      <span style={{ fontSize: '10px' }}>{icon}</span>
      {label}
    </span>
  );
}

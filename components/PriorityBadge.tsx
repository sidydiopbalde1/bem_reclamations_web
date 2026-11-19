import { Priority } from '@/lib/types';

const config: Record<Priority, { label: string; color: string }> = {
  BASSE:   { label: 'Basse',   color: '#90A4AE' },
  NORMALE: { label: 'Normale', color: '#42A5F5' },
  HAUTE:   { label: 'Haute',   color: '#FFA726' },
  URGENTE: { label: 'Urgente', color: '#EF5350' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, color } = config[priority];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold"
      style={{
        color,
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
      }}>
      {label}
    </span>
  );
}

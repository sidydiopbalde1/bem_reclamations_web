'use client';

import { Building, ReclamationCategory, ReclamationFilters, ReclamationStatus, User } from '@/lib/types';

const STATUSES: { value: ReclamationStatus; label: string; color: string }[] = [
  { value: 'OUVERTE',  label: '◎ Ouverte',   color: '#1565C0' },
  { value: 'EN_COURS', label: '⟳ En cours',  color: '#E65100' },
  { value: 'RESOLUE',  label: '✓ Résolue',   color: '#2E7D32' },
  { value: 'REJETEE',  label: '✕ Rejetée',   color: '#757575' },
];

const CATEGORIES: { value: ReclamationCategory; label: string }[] = [
  { value: 'CLIMATISATION', label: '❄️ Climatisation' },
  { value: 'MOBILIER',      label: '🪑 Mobilier' },
  { value: 'ECLAIRAGE',     label: '💡 Éclairage' },
  { value: 'ELECTRICITE',   label: '⚡ Électricité' },
  { value: 'EQUIPEMENT',    label: '🔧 Équipement' },
  { value: 'PLOMBERIE',     label: '🚿 Plomberie' },
  { value: 'PROPRETE',      label: '🧹 Propreté' },
  { value: 'AUTRE',         label: '📋 Autre' },
];

interface Props {
  filters: ReclamationFilters;
  buildings: Building[];
  users: User[];
  onChange: (f: ReclamationFilters) => void;
  showBuildingFilter: boolean;
}

function Select({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium outline-none transition-all duration-200 cursor-pointer"
        style={{
          background: value ? 'rgba(204,0,0,0.06)' : 'white',
          border: value ? '1.5px solid #CC0000' : '1.5px solid #E2E8F0',
          color: value ? '#CC0000' : '#64748B',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {children}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: value ? '#CC0000' : '#94A3B8' }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

export function FilterBar({ filters, buildings, users, onChange, showBuildingFilter }: Props) {
  const activeCount = [filters.status, filters.category, filters.buildingId, filters.assignedToId].filter(Boolean).length;

  function set(key: keyof ReclamationFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select value={filters.status ?? ''} onChange={(v) => set('status', v)}>
        <option value="">Tous les statuts</option>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </Select>

      <Select value={filters.category ?? ''} onChange={(v) => set('category', v)}>
        <option value="">Toutes les catégories</option>
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </Select>

      {showBuildingFilter && (
        <Select value={filters.buildingId ?? ''} onChange={(v) => set('buildingId', v)}>
          <option value="">Tous les bâtiments</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      )}

      {showBuildingFilter && (
        <Select value={filters.assignedToId ?? ''} onChange={(v) => set('assignedToId', v)}>
          <option value="">Tous les responsables</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </Select>
      )}

      {activeCount > 0 && (
        <button
          onClick={() => onChange({ page: 1, limit: filters.limit })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105"
          style={{ background: '#FFF1F1', color: '#CC0000', border: '1.5px solid #FFCDD2' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Réinitialiser ({activeCount})
        </button>
      )}
    </div>
  );
}

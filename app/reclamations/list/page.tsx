'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { reclamationsApi, referentialsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Building, PaginatedReclamations, Reclamation, ReclamationFilters, User } from '@/lib/types';
import { FilterBar } from '@/components/FilterBar';
import { NewReclamationsBanner } from '@/components/NewReclamationsBanner';
import { ReclamationCard } from '@/components/ReclamationCard';
import { SkeletonCard } from '@/components/SkeletonCard';

const STATUS_COLORS: Record<string, string> = {
  OUVERTE: '#1565C0', EN_COURS: '#E65100', RESOLUE: '#2E7D32', REJETEE: '#757575',
};
const STATUS_LABELS: Record<string, string> = {
  OUVERTE: 'Ouvertes', EN_COURS: 'En cours', RESOLUE: 'Résolues', REJETEE: 'Rejetées',
};

function StatCard({ label, value, color, onClick, active }: {
  label: string; value: number; color: string; onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-5 sm:px-6 sm:py-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: active ? `${color}12` : 'white',
        border: active ? `2px solid ${color}50` : '1.5px solid #E2E8F0',
        boxShadow: active ? `0 6px 24px ${color}25` : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Coloured top accent bar */}
      <div className="w-8 h-1 rounded-full mb-3 transition-all duration-200"
        style={{ background: active ? color : `${color}40` }} />
      <div className="text-3xl sm:text-4xl font-black mb-1 leading-none" style={{ color: active ? color : '#0F172A' }}>
        {value}
      </div>
      <div className="text-xs sm:text-sm font-semibold truncate mt-1" style={{ color: active ? color : '#64748B' }}>
        {label}
      </div>
    </button>
  );
}

export default function ReclamationsListPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedReclamations | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<ReclamationFilters>({ page: 1, limit: 20 });
  const [allStats, setAllStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItems, setNewItems] = useState<Reclamation[]>([]);

  const showBuildingFilter = user?.role === 'ADMIN' || user?.role === 'MOYENS_GENERAUX';

  useEffect(() => {
    if (!user) return;
    if (showBuildingFilter) {
      referentialsApi.buildings().then(setBuildings).catch(() => {});
      import('@/lib/api').then(({ usersApi }) => {
        usersApi.list().then(setUsers).catch(() => setUsers([]));
      });
    }
    Promise.all(
      (['OUVERTE', 'EN_COURS', 'RESOLUE', 'REJETEE'] as const).map((s) =>
        reclamationsApi.list({ status: s, limit: 1 }).then((r) => [s, r.total] as const),
      ),
    )
      .then((entries) => setAllStats(Object.fromEntries(entries)))
      .catch(() => {});

    // Nouvelles réclamations (< 24h) pour la bannière — visible ADMIN/MOYENS_GENERAUX
    if (user.role === 'ADMIN' || user.role === 'MOYENS_GENERAUX') {
      reclamationsApi
        .list({ status: 'OUVERTE', limit: 10, page: 1 })
        .then((res) => {
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;
          setNewItems(res.items.filter((r) => new Date(r.createdAt).getTime() > cutoff));
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showBuildingFilter]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    reclamationsApi
      .list(filters)
      .then(setData)
      .catch(() => setError('Impossible de charger les réclamations.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const isRegulateur = user?.role === 'REGULATEUR';
  const canCreateReclamation = user?.role !== 'MOYENS_GENERAUX' && user?.role !== 'REGULATEUR';
  const totalPages = data ? Math.ceil(data.total / (filters.limit ?? 20)) : 0;

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1" style={{ color: '#0F172A' }}>
            {isRegulateur ? 'Mes réclamations' : 'Liste des réclamations'}
          </h1>
          <p className="text-sm font-medium" style={{ color: '#64748B' }}>
            {data ? (
              <><span style={{ color: '#CC0000' }}>{data.total}</span> réclamation{data.total !== 1 ? 's' : ''}{isRegulateur ? ' assignée' : ''}{data.total !== 1 ? 's' : ''} au total</>
            ) : 'Chargement…'}
          </p>
        </div>
        {canCreateReclamation && (
          <Link
            href="/reclamations/new"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 4px 16px rgba(204,0,0,0.35)' }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Nouvelle réclamation</span>
            <span className="sm:hidden">Nouvelle</span>
          </Link>
        )}
      </div>

      {/* Bannière scope régulateur */}
      {isRegulateur && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 animate-slide-up text-sm font-medium"
          style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Vous voyez uniquement les réclamations qui vous ont été assignées.
        </div>
      )}

      {/* Bannière nouvelles réclamations */}
      {newItems.length > 0 && <NewReclamationsBanner items={newItems} />}

      {/* Stat cards filtrantes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 animate-slide-up stagger-1">
        {(['OUVERTE', 'EN_COURS', 'RESOLUE', 'REJETEE'] as const).map((s) => (
          <StatCard
            key={s}
            label={STATUS_LABELS[s]}
            value={allStats[s] ?? 0}
            color={STATUS_COLORS[s]}
            active={filters.status === s}
            onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? undefined : s, page: 1 }))}
          />
        ))}
      </div>

      {/* Filtres + compteur */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 animate-slide-up stagger-2">
        <FilterBar
          filters={filters}
          buildings={buildings}
          users={users}
          onChange={setFilters}
          showBuildingFilter={showBuildingFilter}
        />
        {data && !loading && (
          <span className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#F1F5F9', color: '#64748B' }}>
            {data.total} résultat{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div
          className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-5"
          style={{ background: '#FFF1F1', border: '1px solid #FFCDD2', color: '#CC0000' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} delay={i * 60} />)}
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg font-bold mb-1" style={{ color: '#0F172A' }}>Aucune réclamation</p>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>Modifiez les filtres{canCreateReclamation ? ' ou créez-en une nouvelle' : ''}.</p>
          {canCreateReclamation && (
            <Link
              href="/reclamations/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 4px 16px rgba(204,0,0,0.3)' }}
            >
              + Nouvelle réclamation
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((rec, i) => <ReclamationCard key={rec.id} rec={rec} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 animate-fade-in">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 hover:scale-105"
            style={{ background: 'white', border: '1.5px solid #E2E8F0', color: '#0F172A', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            ← Précédent
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              const isActive = filters.page === p;
              return (
                <button
                  key={p}
                  onClick={() => setFilters((f) => ({ ...f, page: p }))}
                  className="w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-110"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #CC0000, #990000)' : 'white',
                    color: isActive ? 'white' : '#64748B',
                    border: isActive ? 'none' : '1.5px solid #E2E8F0',
                    boxShadow: isActive ? '0 4px 12px rgba(204,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            disabled={filters.page === totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 hover:scale-105"
            style={{ background: 'white', border: '1.5px solid #E2E8F0', color: '#0F172A', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

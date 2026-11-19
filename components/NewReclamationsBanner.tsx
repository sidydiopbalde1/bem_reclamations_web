'use client';

import Link from 'next/link';
import { Reclamation } from '@/lib/types';

const CATEGORY_LABELS: Record<string, string> = {
  CLIMATISATION: 'Climatisation', MOBILIER: 'Mobilier', ECLAIRAGE: 'Éclairage',
  ELECTRICITE: 'Électricité', EQUIPEMENT: 'Équipement', PLOMBERIE: 'Plomberie',
  PROPRETE: 'Propreté', AUTRE: 'Autre',
};

const CATEGORY_ICONS: Record<string, string> = {
  CLIMATISATION: '❄️', MOBILIER: '🪑', ECLAIRAGE: '💡',
  ELECTRICITE: '⚡', EQUIPEMENT: '🔧', PLOMBERIE: '🚿',
  PROPRETE: '🧹', AUTRE: '📋',
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  URGENTE: { bg: '#FEE2E2', text: '#991B1B' },
  HAUTE: { bg: '#FEF3C7', text: '#92400E' },
  NORMALE: { bg: '#EFF6FF', text: '#1E40AF' },
  BASSE: { bg: '#F0FDF4', text: '#166534' },
};

export function NewReclamationsBanner({ items }: { items: Reclamation[] }) {
  if (!items.length) return null;

  const urgentCount = items.filter((r) => r.priority === 'URGENTE').length;

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up mb-8"
      style={{
        border: '1.5px solid #FCA5A5',
        boxShadow: '0 8px 32px rgba(204,0,0,0.12)',
      }}
    >
      {/* Header bannière */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, #CC0000 0%, #991100 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icône pulsante */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)' }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            {/* Dot clignotant */}
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-red-700 animate-ping"
              style={{ background: '#FCA5A5' }}
            />
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-red-700"
              style={{ background: '#FF6B6B' }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">
                {items.length} nouvelle{items.length > 1 ? 's' : ''} réclamation{items.length > 1 ? 's' : ''}
              </span>
              {urgentCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                  style={{ background: '#FEF2F2', color: '#991B1B' }}
                >
                  ⚡ {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Soumises dans les dernières 24 heures - action requise
            </p>
          </div>
        </div>

        <Link
          href="/reclamations/list"
          className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition hover:bg-white/20"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.22)', whiteSpace: 'nowrap' }}
        >
          Tout voir
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </div>

      {/* Liste des nouvelles réclamations */}
      <div style={{ background: '#FFF5F5' }}>
        {items.map((rec, i) => {
          const pColors = PRIORITY_COLORS[rec.priority] ?? { bg: '#F1F5F9', text: '#64748B' };
          return (
            <Link key={rec.id} href={`/reclamations/${rec.id}`}>
              <div
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-red-50/60 group"
                style={{
                  borderBottom: i < items.length - 1 ? '1px solid #FED7D7' : 'none',
                }}
              >
                {/* Numéro */}
                <span
                  className="flex-shrink-0 text-xs font-black rounded-lg px-2 py-1"
                  style={{ background: '#FEE2E2', color: '#CC0000', minWidth: '40px', textAlign: 'center' }}
                >
                  #{rec.number}
                </span>

                {/* Icône + catégorie */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">{CATEGORY_ICONS[rec.category]}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {CATEGORY_LABELS[rec.category] ?? rec.category}
                      </span>
                      <span
                        className="hidden sm:inline text-xs font-semibold rounded-full px-2 py-0.5"
                        style={{ background: pColors.bg, color: pColors.text }}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {rec.room.building.name} · Salle {rec.room.number} · {rec.program.name}
                    </p>
                  </div>
                </div>

                {/* Description tronquée */}
                <p className="hidden md:block text-xs text-slate-400 line-clamp-1 max-w-[200px] flex-shrink-0">
                  {rec.description}
                </p>

                {/* Heure */}
                <span className="flex-shrink-0 text-xs font-semibold" style={{ color: '#CC0000' }}>
                  {new Date(rec.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Flèche hover */}
                <svg
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#CC0000' }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

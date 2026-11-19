import Link from 'next/link';
import { Reclamation } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

const CATEGORY_LABELS: Record<string, string> = {
  CLIMATISATION: 'Climatisation', MOBILIER: 'Mobilier', ECLAIRAGE: 'Éclairage',
  ELECTRICITE: 'Électricité', EQUIPEMENT: 'Équipement', PLOMBERIE: 'Plomberie',
  PROPRETE: 'Propreté', AUTRE: 'Autre',
};

const PRIORITY_BORDER: Record<string, string> = {
  BASSE: '#90A4AE', NORMALE: '#42A5F5', HAUTE: '#FFA726', URGENTE: '#EF5350',
};

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export function ReclamationCard({ rec, index = 0 }: { rec: Reclamation; index?: number }) {
  const borderColor = PRIORITY_BORDER[rec.priority] ?? '#E2E8F0';
  const nouveau = isNew(rec.createdAt);

  return (
    <Link href={`/reclamations/${rec.id}`}>
      <div
        className="animate-slide-up card-hover bg-white rounded-2xl overflow-hidden cursor-pointer group relative"
        style={{
          border: nouveau ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
          borderLeft: `4px solid ${borderColor}`,
          boxShadow: nouveau
            ? '0 4px 20px rgba(204,0,0,0.12), 0 0 0 1px rgba(204,0,0,0.06)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          animationDelay: `${index * 60}ms`,
        }}
      >
        {/* Badge NOUVEAU */}
        {nouveau && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #CC0000, #FF4444)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(204,0,0,0.4)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-white"
              style={{ boxShadow: '0 0 4px rgba(255,255,255,0.8)' }}
            />
            Nouveau
          </div>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
              {CATEGORY_LABELS[rec.category] ?? rec.category}
            </span>
            <div className={`flex gap-1.5 ${nouveau ? 'mr-12 sm:mr-16' : ''} flex-shrink-0`}>
              <PriorityBadge priority={rec.priority} />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: '#64748B' }}>
            {rec.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={rec.status} />
            <div className="text-xs font-medium flex items-center gap-3" style={{ color: '#94A3B8' }}>
              <span className="flex items-center gap-1">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {rec.room.building.name}
              </span>
              <span>Salle {rec.room.number}</span>
            </div>
          </div>

          {rec.assignedTo && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold"
              style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
              <span>Assignée à</span>
              <span>{rec.assignedTo.fullName}</span>
            </div>
          )}
        </div>

        {/* Bottom date bar */}
        <div
          className="px-5 py-2.5 flex items-center justify-between"
          style={{
            background: nouveau ? '#FFF5F5' : '#F8FAFC',
            borderTop: nouveau ? '1px solid #FCA5A5' : '1px solid #F1F5F9',
          }}
        >
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: nouveau ? '#EF4444' : '#94A3B8' }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {new Date(rec.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {nouveau && (
              <span className="ml-1 font-semibold" style={{ color: '#EF4444' }}>
                · Aujourd'hui
              </span>
            )}
          </span>
          <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            style={{ color: '#CC0000' }}>
            Voir →
          </span>
        </div>
      </div>
    </Link>
  );
}

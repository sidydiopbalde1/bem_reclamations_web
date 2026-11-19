'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reclamationsApi, usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { canAssignReclamation, canChangeStatus } from '@/lib/auth';
import { Reclamation, User } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusUpdateDialog } from '@/components/StatusUpdateDialog';

const CATEGORY_LABELS: Record<string, string> = {
  CLIMATISATION: 'Climatisation', MOBILIER: 'Mobilier', ECLAIRAGE: 'Éclairage',
  ELECTRICITE: 'Électricité', EQUIPEMENT: 'Équipement', PLOMBERIE: 'Plomberie',
  PROPRETE: 'Propreté', AUTRE: 'Autre',
};
const CATEGORY_ICONS: Record<string, string> = {
  CLIMATISATION: '❄️', MOBILIER: '🪑', ECLAIRAGE: '💡',
  ELECTRICITE: '⚡', EQUIPEMENT: '🔧', PLOMBERIE: '🚿', PROPRETE: '🧹', AUTRE: '📋',
};
const STATUS_LABELS: Record<string, string> = {
  OUVERTE: 'Ouverte', EN_COURS: 'En cours', RESOLUE: 'Résolue', REJETEE: 'Rejetée',
};
const STATUS_COLORS: Record<string, string> = {
  OUVERTE: '#1565C0', EN_COURS: '#E65100', RESOLUE: '#2E7D32', REJETEE: '#757575',
};

function fmt(date: string) {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
        {icon} {label}
      </span>
      <span className="text-sm font-bold" style={{ color: '#0F172A' }}>{value}</span>
    </div>
  );
}

export default function ReclamationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [rec, setRec] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

  const canAssign = !!user && canAssignReclamation(user.role);

  useEffect(() => {
    reclamationsApi.get(id).then(setRec)
      .catch(() => setError('Réclamation introuvable.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!canAssign) return;

    usersApi.list()
      .then((allUsers) => setUsers(allUsers.filter((userItem) => userItem.role === 'REGULATEUR')))
      .catch(() => setUsers([]));
  }, [canAssign]);

  const handleAssign = async (assignedToId: string | null) => {
    if (!rec) return;

    setAssigning(true);
    try {
      const updated = await reclamationsApi.assign(rec.id, { assignedToId });
      setRec(updated);
    } catch {
      setError('Impossible de modifier l’assignation.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #CC0000, #990000)' }}>
            <svg className="animate-spin-slow" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#64748B' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  if (error || !rec) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">🔍</div>
        <p className="font-bold mb-1" style={{ color: '#0F172A' }}>Réclamation introuvable</p>
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>{error}</p>
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #CC0000, #990000)' }}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl animate-fade-in">
      {/* Back button */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold mb-6 px-3 py-2 rounded-xl transition-all hover:scale-105"
        style={{ color: '#CC0000', background: '#FFF1F1', border: '1px solid #FFCDD2' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Retour à la liste
      </button>

      {/* Main card */}
      <div className="bg-white rounded-3xl overflow-hidden mb-5 animate-slide-up"
        style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>

        {/* Top gradient band */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #CC0000, #FF6B6B, #E65100)' }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                {CATEGORY_ICONS[rec.category]}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md" style={{ background: '#F1F5F9', color: '#64748B' }}>
                    #{rec.number}
                  </span>
                </div>
                <h1 className="text-xl font-black" style={{ color: '#0F172A' }}>
                  {CATEGORY_LABELS[rec.category] ?? rec.category}
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={rec.status} />
              <PriorityBadge priority={rec.priority} />
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <InfoChip icon="🏢" label="Bâtiment" value={rec.room.building.name} />
            <InfoChip icon="🚪" label="Salle" value={rec.room.number} />
            <InfoChip icon="📚" label="Programme" value={rec.program.name} />
            <InfoChip icon="👤" label="Signalé par" value={rec.reportedBy.fullName} />
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl mb-6" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>Description</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ color: '#0F172A' }}>
              {rec.description}
            </p>
          </div>

          {canAssign && (
            <div className="p-4 rounded-2xl mb-6" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
                Responsable
              </label>
              <select
                value={rec.assignedTo?.id ?? ''}
                onChange={(event) => handleAssign(event.target.value || null)}
                disabled={assigning}
                className="w-full rounded-xl border px-3 py-2 text-sm font-medium outline-none"
                style={{ borderColor: '#E2E8F0', background: '#FFFFFF', color: '#0F172A' }}
              >
                <option value="">Non assignée</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold" style={{ color: '#94A3B8' }}>
            <span>📅 Créée le {fmt(rec.createdAt)}</span>
            {rec.resolvedAt && <span style={{ color: '#2E7D32' }}>✓ Résolue le {fmt(rec.resolvedAt)}</span>}
          </div>
        </div>

        {/* Action bar */}
        {user && canChangeStatus(user.role) && (
          <div className="px-6 py-4" style={{ background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
            <StatusUpdateDialog reclamation={rec} onUpdated={setRec} />
          </div>
        )}
      </div>

      {/* Timeline */}
      {rec.events && rec.events.length > 0 && (
        <div className="animate-slide-up stagger-2">
          <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#64748B' }}>
            Historique des événements
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: '#E2E8F0' }} />

            <div className="space-y-3">
              {rec.events.map((ev, i) => {
                const color = STATUS_COLORS[ev.toStatus] ?? '#64748B';
                return (
                  <div key={ev.id} className="flex gap-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: `${color}18`, border: `2px solid ${color}`, color }}>
                      {i === 0 ? '★' : '→'}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-white rounded-2xl p-4 mb-1"
                      style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: '#0F172A' }}>{ev.author.fullName}</span>
                          {ev.fromStatus ? (
                            <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
                              {STATUS_LABELS[ev.fromStatus]}
                              <span className="mx-1">→</span>
                              <span style={{ color }}>{STATUS_LABELS[ev.toStatus]}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold" style={{ color }}>
                              Ouverture
                            </span>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: '#94A3B8' }}>{fmt(ev.createdAt)}</span>
                      </div>
                      {ev.comment && (
                        <p className="text-sm mt-2 leading-relaxed" style={{ color: '#64748B' }}>{ev.comment}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

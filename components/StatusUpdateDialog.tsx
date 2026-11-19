'use client';

import { FormEvent, useState } from 'react';
import { reclamationsApi } from '@/lib/api';
import { Reclamation, ReclamationStatus } from '@/lib/types';

const TRANSITIONS: Record<ReclamationStatus, ReclamationStatus[]> = {
  OUVERTE:  ['EN_COURS', 'REJETEE'],
  EN_COURS: ['RESOLUE', 'REJETEE'],
  RESOLUE:  ['OUVERTE'],
  REJETEE:  ['OUVERTE'],
};

const STATUS_CONFIG: Record<ReclamationStatus, { label: string; color: string; icon: string }> = {
  OUVERTE:  { label: 'Ouverte',   color: '#1565C0', icon: '◎' },
  EN_COURS: { label: 'En cours',  color: '#E65100', icon: '⟳' },
  RESOLUE:  { label: 'Résolue',   color: '#2E7D32', icon: '✓' },
  REJETEE:  { label: 'Rejetée',   color: '#757575', icon: '✕' },
};

interface Props {
  reclamation: Reclamation;
  onUpdated: (rec: Reclamation) => void;
}

export function StatusUpdateDialog({ reclamation, onUpdated }: Props) {
  const transitions = TRANSITIONS[reclamation.status] ?? [];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ReclamationStatus>(transitions[0]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  if (transitions.length === 0) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await reclamationsApi.updateStatus(reclamation.id, { status, comment });
      onUpdated(updated);
      setOpen(false);
      setComment('');
    } catch {
      setError('Impossible de mettre à jour le statut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 4px 16px rgba(204,0,0,0.3)' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-.18-4.59"/>
        </svg>
        Changer le statut
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden"
            style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black" style={{ color: '#0F172A' }}>Mettre à jour le statut</h2>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-gray-100"
                  style={{ color: '#64748B' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                Réclamation <strong>#{reclamation.number}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Status picker */}
              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: '#0F172A' }}>Nouveau statut</label>
                <div className="grid grid-cols-2 gap-2">
                  {transitions.map((s) => {
                    const { label, color, icon } = STATUS_CONFIG[s];
                    const isSelected = status === s;
                    return (
                      <button key={s} type="button" onClick={() => setStatus(s)}
                        className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                          background: isSelected ? `${color}12` : '#F8FAFC',
                          border: isSelected ? `2px solid ${color}` : '2px solid #E2E8F0',
                          color: isSelected ? color : '#64748B',
                          boxShadow: isSelected ? `0 4px 12px ${color}20` : 'none',
                        }}>
                        <span>{icon}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#0F172A' }}>
                  Commentaire <span className="font-normal text-xs" style={{ color: '#94A3B8' }}>(optionnel)</span>
                </label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  rows={3} maxLength={500}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 resize-none"
                  style={{
                    background: focused ? 'rgba(204,0,0,0.03)' : '#F8FAFC',
                    border: focused ? '2px solid #CC0000' : '2px solid #E2E8F0',
                    color: '#0F172A',
                  }}
                  placeholder="Ajoutez un commentaire…" />
              </div>

              {error && (
                <p className="text-sm font-medium" style={{ color: '#CC0000' }}>{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:bg-slate-50"
                  style={{ border: '2px solid #E2E8F0', color: '#64748B' }}>
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 4px 16px rgba(204,0,0,0.3)' }}>
                  {loading ? (
                    <svg className="animate-spin-slow" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  ) : '✓ Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

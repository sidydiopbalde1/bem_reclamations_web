'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reclamationsApi, referentialsApi } from '@/lib/api';
import { Building, Priority, Program, ReclamationCategory } from '@/lib/types';

const CATEGORIES: { value: ReclamationCategory; label: string; icon: string }[] = [
  { value: 'CLIMATISATION', label: 'Climatisation', icon: '❄️' },
  { value: 'MOBILIER',      label: 'Mobilier',      icon: '🪑' },
  { value: 'ECLAIRAGE',     label: 'Éclairage',     icon: '💡' },
  { value: 'ELECTRICITE',   label: 'Électricité',   icon: '⚡' },
  { value: 'EQUIPEMENT',    label: 'Équipement',    icon: '🔧' },
  { value: 'PLOMBERIE',     label: 'Plomberie',     icon: '🚿' },
  { value: 'PROPRETE',      label: 'Propreté',      icon: '🧹' },
  { value: 'AUTRE',         label: 'Autre',         icon: '📋' },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'BASSE',   label: 'Basse',   color: '#90A4AE' },
  { value: 'NORMALE', label: 'Normale', color: '#42A5F5' },
  { value: 'HAUTE',   label: 'Haute',   color: '#FFA726' },
  { value: 'URGENTE', label: 'Urgente', color: '#EF5350' },
];

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
        style={{
          background: done ? '#2E7D32' : active ? 'linear-gradient(135deg, #CC0000, #990000)' : '#E2E8F0',
          color: done || active ? 'white' : '#94A3B8',
          boxShadow: active ? '0 4px 12px rgba(204,0,0,0.3)' : 'none',
        }}>
        {done ? '✓' : n}
      </div>
      <span className="text-xs font-semibold hidden sm:block" style={{ color: active ? '#CC0000' : done ? '#2E7D32' : '#94A3B8' }}>
        {label}
      </span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold mb-2" style={{ color: '#0F172A' }}>{children}</label>;
}

function StyledSelect({ value, onChange, disabled, children, focused, onFocus, onBlur }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
  focused?: boolean; onFocus?: () => void; onBlur?: () => void;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        onFocus={onFocus} onBlur={onBlur}
        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
        style={{
          background: focused ? 'rgba(204,0,0,0.03)' : '#F8FAFC',
          border: focused ? '2px solid #CC0000' : '2px solid #E2E8F0',
          color: '#0F172A',
        }}>
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? '#CC0000' : '#94A3B8' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

export function ReclamationForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [roomId, setRoomId]         = useState('');
  const [programId, setProgramId]   = useState('');
  const [category, setCategory]     = useState<ReclamationCategory>('AUTRE');
  const [priority, setPriority]     = useState<Priority>('NORMALE');
  const [description, setDescription] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([referentialsApi.buildings(), referentialsApi.programs()])
      .then(([b, p]) => {
        setBuildings(b);
        setPrograms(p);
        const delegateProgramId = user?.role === 'DELEGUE' ? (user.programId ?? user.program?.id ?? '') : '';
        if (delegateProgramId) {
          setProgramId(delegateProgramId);
        }
      })
      .catch(() => setError('Impossible de charger les données.'));
  }, [user]);

  const rooms = buildings.find((b) => b.id === buildingId)?.rooms ?? [];
  const step1done = !!buildingId && !!roomId;
  const step2done = !!programId && !!category;
  const step3done = description.length >= 5;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reclamationsApi.create({ roomId, programId, category, priority, description });
      router.push('/reclamations');
    } catch {
      setError('Impossible de créer la réclamation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl animate-slide-up">
      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-2xl" style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Step n={1} label="Localisation" active={!step1done} done={step1done} />
        <div className="flex-1 h-0.5 rounded-full" style={{ background: step1done ? '#2E7D32' : '#E2E8F0' }} />
        <Step n={2} label="Catégorie" active={step1done && !step2done} done={step2done} />
        <div className="flex-1 h-0.5 rounded-full" style={{ background: step2done ? '#2E7D32' : '#E2E8F0' }} />
        <Step n={3} label="Description" active={step2done && !step3done} done={step3done} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1 */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#CC0000' }}>
            1 · Localisation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Bâtiment</FieldLabel>
              <StyledSelect value={buildingId} onChange={(v) => { setBuildingId(v); setRoomId(''); }}
                focused={focused === 'building'} onFocus={() => setFocused('building')} onBlur={() => setFocused(null)}>
                <option value="">Sélectionner…</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </StyledSelect>
            </div>
            <div>
              <FieldLabel>Salle</FieldLabel>
              <StyledSelect value={roomId} onChange={setRoomId} disabled={!buildingId}
                focused={focused === 'room'} onFocus={() => setFocused('room')} onBlur={() => setFocused(null)}>
                <option value="">Sélectionner…</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>Salle {r.number}</option>)}
              </StyledSelect>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#CC0000' }}>
            2 · Catégorie & Programme
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Catégorie</FieldLabel>
              <StyledSelect value={category} onChange={(v) => setCategory(v as ReclamationCategory)}
                focused={focused === 'category'} onFocus={() => setFocused('category')} onBlur={() => setFocused(null)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </StyledSelect>
            </div>
            <div>
              <FieldLabel>Priorité</FieldLabel>
              <StyledSelect value={priority} onChange={(v) => setPriority(v as Priority)}
                focused={focused === 'priority'} onFocus={() => setFocused('priority')} onBlur={() => setFocused(null)}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </StyledSelect>
            </div>
          </div>
          <div>
            <FieldLabel>Programme</FieldLabel>
            <StyledSelect
              value={programId}
              onChange={setProgramId}
              disabled={user?.role === 'DELEGUE' && !!programId}
              focused={focused === 'program'}
              onFocus={() => setFocused('program')}
              onBlur={() => setFocused(null)}
            >
              <option value="">Sélectionner…</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </StyledSelect>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#CC0000' }}>
            3 · Description
          </h3>
          <textarea required minLength={5} maxLength={1000} rows={5} value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 resize-none leading-relaxed"
            style={{
              background: focused === 'desc' ? 'rgba(204,0,0,0.03)' : '#F8FAFC',
              border: focused === 'desc' ? '2px solid #CC0000' : '2px solid #E2E8F0',
              color: '#0F172A',
            }}
            placeholder="Décrivez le problème avec précision…" />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: description.length >= i * 100 ? '#CC0000' : '#E2E8F0' }} />
              ))}
            </div>
            <span className="text-xs font-semibold ml-3" style={{ color: '#94A3B8' }}>
              {description.length}/1000
            </span>
          </div>
        </div>

        {error && (
          <div className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: '#FFF1F1', border: '1px solid #FFCDD2', color: '#CC0000' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'white', border: '2px solid #E2E8F0', color: '#64748B' }}>
            Annuler
          </button>
          <button type="submit" disabled={loading || !step1done || !programId || !step3done}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, #CC0000, #990000)',
              boxShadow: '0 4px 16px rgba(204,0,0,0.35)',
            }}>
            {loading ? (
              <>
                <svg className="animate-spin-slow" width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Soumettre la réclamation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

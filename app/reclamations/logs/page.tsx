'use client';

import { auditLogsApi, usersApi } from '@/lib/api';
import { AuditLog, User } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  CREATE_RECLAMATION: 'Création réclamation',
  UPDATE_STATUS: 'Changement de statut',
  ASSIGN_RECLAMATION: 'Assignation',
  UNASSIGN_RECLAMATION: 'Désassignation',
  CREATE_USER: 'Création utilisateur',
  UPDATE_USER: 'Modification utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  IMPORT_USERS: 'Import utilisateurs',
};

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LOGIN: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  CREATE_RECLAMATION: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  UPDATE_STATUS: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  ASSIGN_RECLAMATION: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  UNASSIGN_RECLAMATION: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  CREATE_USER: { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  UPDATE_USER: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE68A' },
  DELETE_USER: { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  IMPORT_USERS: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  LOGIN: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  CREATE_RECLAMATION: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  UPDATE_STATUS: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  ASSIGN_RECLAMATION: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  UNASSIGN_RECLAMATION: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  CREATE_USER: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  UPDATE_USER: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.5a2 2 0 0 1 3 3l-9 9L7 17l1.5-3 7.5-7.5z"/>
    </svg>
  ),
  DELETE_USER: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  ),
  IMPORT_USERS: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ActionBadge({ action }: { action: string }) {
  const colors = ACTION_COLORS[action] ?? { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
  const icon = ACTION_ICONS[action] ?? null;
  const label = ACTION_LABELS[action] ?? action;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {icon}
      {label}
    </span>
  );
}

function DetailsPanel({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(details).map(([key, val]) => (
        <span key={key} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono" style={{ background: '#F1F5F9', color: '#475569' }}>
          <span className="font-semibold text-slate-500">{key}:</span>
          <span>{String(val)}</span>
        </span>
      ))}
    </div>
  );
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const limit = 25;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    auditLogsApi
      .list({
        page,
        limit,
        ...(filterAction ? { action: filterAction } : {}),
        ...(filterUserId ? { userId: filterUserId } : {}),
      })
      .then((data) => {
        setLogs(data.items);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterAction, filterUserId]);

  const totalPages = Math.ceil(total / limit);

  function resetFilters() {
    setFilterAction('');
    setFilterUserId('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Journaux d'activité</h1>
          <p className="text-sm text-slate-500 mt-1">Suivi de toutes les actions effectuées dans le système</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#CC0000" strokeWidth={2}>
            <path d="M9 12l2 2 4-4"/>
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
          </svg>
          <span className="text-sm font-semibold text-slate-700">{total} entrée{total > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Action</label>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              <option value="">Toutes les actions</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a]}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisateur</label>
            <select
              value={filterUserId}
              onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {(filterAction || filterUserId) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="animate-spin mb-3" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#CC0000" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-sm">Chargement des logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mb-3 opacity-30">
              <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            </svg>
            <span className="text-sm font-medium">Aucune entrée trouvée</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entité</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Détails</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-800">{log.user.fullName}</div>
                          <div className="text-xs text-slate-400">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.entity ? (
                        <div>
                          <span className="font-medium text-slate-700">{log.entity}</span>
                          {log.entityId && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                              {log.entityId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <DetailsPanel details={log.details} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                      {log.ipAddress ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page <span className="font-semibold text-slate-700">{page}</span> sur <span className="font-semibold text-slate-700">{totalPages}</span>
            {' '}— <span className="font-semibold text-slate-700">{total}</span> entrée{total > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

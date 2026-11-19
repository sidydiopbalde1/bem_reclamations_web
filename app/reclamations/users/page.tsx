'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canManageUsers } from '@/lib/auth';
import { referentialsApi, usersApi } from '@/lib/api';
import { Building, CreateUserInput, Program, Role, User } from '@/lib/types';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  MOYENS_GENERAUX: 'Moyens Généraux',
  REGULATEUR: 'Régulateur',
  VIGILE: 'Vigile',
  DELEGUE: 'Délégué',
};

const EMPTY_FORM = {
  fullName: '',
  email: '',
  role: 'DELEGUE' as Role,
  buildingId: '',
  programId: '',
  password: '',
};

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!canManageUsers(user.role)) {
      router.replace('/reclamations');
      return;
    }

    Promise.all([usersApi.list(), referentialsApi.buildings(), referentialsApi.programs()])
      .then(([usersList, buildingsList, programsList]) => {
        setUsers(usersList);
        setBuildings(buildingsList);
        setPrograms(programsList);
      })
      .catch(() => setError('Impossible de charger la liste des utilisateurs.'))
      .finally(() => setLoading(false));
  }, [router, user]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload: CreateUserInput = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      buildingId: form.buildingId || null,
      programId: form.role === 'DELEGUE' ? (form.programId || programs[0]?.id || null) : null,
      ...(form.password ? { password: form.password } : {}),
    };

    if (!payload.fullName || !payload.email) {
      setError('Le nom et l’email sont obligatoires.');
      return;
    }

    if (payload.role === 'VIGILE' && !payload.buildingId) {
      setError('Un vigile doit être associé à un bâtiment.');
      return;
    }

    if (payload.role === 'DELEGUE' && !payload.programId) {
      setError('Un délégué doit être associé à un programme.');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        const updatedUser = await usersApi.update(editingId, payload);
        setUsers((current) => current.map((userItem) => userItem.id === editingId ? updatedUser : userItem));
        setSuccess('Utilisateur mis à jour avec succès.');
      } else {
        const createdUser = await usersApi.create(payload);
        setUsers((current) => [createdUser, ...current]);
        setSuccess('Utilisateur créé avec succès.');
      }

      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (selectedUser: User) => {
    setEditingId(selectedUser.id);
    setShowForm(true);
    setForm({
      fullName: selectedUser.fullName,
      email: selectedUser.email,
      role: selectedUser.role,
      buildingId: selectedUser.buildingId ?? '',
      programId: selectedUser.programId ?? selectedUser.program?.id ?? '',
      password: '',
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;

    try {
      await usersApi.remove(id);
      setUsers((current) => current.filter((userItem) => userItem.id !== id));
      if (editingId === id) resetForm();
      setSuccess('Utilisateur supprimé.');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de supprimer cet utilisateur.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');
      setSuccess('');
      const result = await usersApi.import(file);
      setUsers((current) => {
        const incoming = result.users.filter((importedUser) => !current.some((item) => item.email === importedUser.email));
        return [...incoming.map((item) => ({
          id: item.id,
          fullName: item.fullName,
          email: item.email,
          role: item.role as Role,
          buildingId: null,
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        })), ...current];
      });
      setSuccess(`${result.imported} utilisateur(s) importé(s) avec succès.`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible d’importer le fichier Excel.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (!user || !canManageUsers(user.role)) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: '#CC0000' }}>
            Gestion
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#0F172A' }}>
            Utilisateurs
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 12px 24px rgba(204,0,0,0.2)' }}
          >
            {showForm ? 'Fermer le formulaire' : 'Ajouter un utilisateur'}
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #0F172A, #334155)', boxShadow: '0 12px 24px rgba(15,23,42,0.16)' }}>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            {importing ? 'Import en cours...' : 'Importer Excel'}
          </label>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 animate-scale-in mx-auto w-full max-w-3xl"
          style={{ background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>
              {editingId ? 'Modifier l’utilisateur' : 'Ajouter un utilisateur'}
            </h2>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition hover:scale-[1.02]"
              style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}>
              Annuler
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Nom complet</label>
              <input
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}
                placeholder="Ex. Sarah Diop"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}
                placeholder="nom@bem.sn"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Rôle</label>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
                className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>

            {form.role === 'VIGILE' && (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Bâtiment</label>
                <select
                  value={form.buildingId}
                  onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                  style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                  <option value="">Sélectionner un bâtiment</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.role === 'DELEGUE' && (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Programme</label>
                <select
                  value={form.programId}
                  onChange={(event) => setForm((current) => ({ ...current, programId: event.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                  style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                  <option value="">Sélectionner un programme</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1" style={{ color: '#334155' }}>Mot de passe par défaut</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2"
                style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}
                placeholder="Laisser vide pour utiliser Bem2025!"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl px-3 py-2 text-sm font-medium" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl px-3 py-2 text-sm font-medium" style={{ background: '#DCFCE7', color: '#166534' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #CC0000, #990000)', boxShadow: '0 12px 24px rgba(204,0,0,0.2)' }}>
            {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer l’utilisateur'}
          </button>
        </form>
      )}

      <div className="rounded-2xl overflow-hidden mx-auto w-full max-w-5xl" style={{ background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>Liste des utilisateurs</h2>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-slate-500">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">Aucun utilisateur pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Nom</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Email</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Rôle</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Bâtiment</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Programme</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase" style={{ color: '#64748B' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem, index) => (
                  <tr key={userItem.id} className="border-t transition-all duration-200 hover:bg-slate-50" style={{ borderColor: '#E2E8F0', animationDelay: `${index * 40}ms` }}>
                    <td className="px-5 py-4 font-semibold" style={{ color: '#0F172A' }}>{userItem.fullName}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>{userItem.email}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-transform duration-200 hover:scale-105"
                        style={{ background: '#F1F5F9', color: '#0F172A' }}>
                        {ROLE_LABELS[userItem.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>
                      {userItem.building?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>
                      {userItem.program?.name ?? (userItem.role === 'DELEGUE' ? userItem.programId ?? '—' : '—')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(userItem)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                          style={{ background: '#0F172A' }}>
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDelete(userItem.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                          style={{ background: '#DC2626' }}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

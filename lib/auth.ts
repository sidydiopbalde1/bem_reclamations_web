import { User } from './types';

export function saveSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function canChangeStatus(role: string) {
  return role === 'ADMIN' || role === 'MOYENS_GENERAUX' || role === 'REGULATEUR';
}

export function canManageUsers(role: string) {
  return role === 'ADMIN';
}

export function canAssignReclamation(role: string) {
  return role === 'ADMIN' || role === 'MOYENS_GENERAUX';
}

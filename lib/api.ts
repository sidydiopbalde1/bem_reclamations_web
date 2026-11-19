import axios from 'axios';
import {
  AssignReclamationDto,
  AuditLogFilters,
  Building,
  CreateReclamationDto,
  CreateUserInput,
  DashboardStats,
  LoginResponse,
  PaginatedAuditLogs,
  PaginatedReclamations,
  Program,
  Reclamation,
  ReclamationFilters,
  UpdateStatusDto,
  UpdateUserInput,
  User,
} from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ success: boolean; user: User }>('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

export const referentialsApi = {
  buildings: () => api.get<Building[]>('/buildings').then((r) => r.data),
  programs: () => api.get<Program[]>('/programs').then((r) => r.data),
};

export const reclamationsApi = {
  list: (filters: ReclamationFilters = {}) =>
    api.get<PaginatedReclamations>('/reclamations', { params: filters }).then((r) => r.data),
  stats: () => api.get<DashboardStats>('/reclamations/stats').then((r) => r.data),
  get: (id: string) => api.get<Reclamation>(`/reclamations/${id}`).then((r) => r.data),
  create: (dto: CreateReclamationDto) =>
    api.post<Reclamation>('/reclamations', dto).then((r) => r.data),
  updateStatus: (id: string, dto: UpdateStatusDto) =>
    api.patch<Reclamation>(`/reclamations/${id}/status`, dto).then((r) => r.data),
  assign: (id: string, dto: AssignReclamationDto) =>
    api.patch<Reclamation>(`/reclamations/${id}/assign`, dto).then((r) => r.data),
};

export const auditLogsApi = {
  list: (filters: AuditLogFilters = {}) =>
    api.get<PaginatedAuditLogs>('/audit-logs', { params: filters }).then((r) => r.data),
};

export const usersApi = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
  create: (dto: CreateUserInput) => api.post<User>('/users', dto).then((r) => r.data),
  update: (id: string, dto: UpdateUserInput) => api.patch<User>(`/users/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/users/${id}`).then((r) => r.data),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ imported: number; users: Array<{ id: string; fullName: string; email: string; role: string }> }>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

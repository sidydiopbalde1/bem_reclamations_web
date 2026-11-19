export type Role = 'ADMIN' | 'MOYENS_GENERAUX' | 'REGULATEUR' | 'VIGILE' | 'DELEGUE';

export type ReclamationStatus = 'OUVERTE' | 'EN_COURS' | 'RESOLUE' | 'REJETEE';

export type ReclamationCategory =
  | 'CLIMATISATION'
  | 'MOBILIER'
  | 'ECLAIRAGE'
  | 'ELECTRICITE'
  | 'EQUIPEMENT'
  | 'PLOMBERIE'
  | 'PROPRETE'
  | 'AUTRE';

export type Priority = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export interface UserBuilding {
  id: string;
  name: string;
}

export interface UserProgram {
  id: string;
  name: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  buildingId: string | null;
  programId?: string | null;
  mustChangePassword: boolean;
  building?: UserBuilding | null;
  program?: UserProgram | null;
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  number: string;
  buildingId: string;
  building?: Building;
}

export interface Program {
  id: string;
  name: string;
}

export interface ReclamationEvent {
  id: string;
  fromStatus: ReclamationStatus | null;
  toStatus: ReclamationStatus;
  comment: string | null;
  createdAt: string;
  author: { id: string; fullName: string };
}

export interface Reclamation {
  id: string;
  number: number;
  category: ReclamationCategory;
  priority: Priority;
  status: ReclamationStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  room: Room & { building: Building };
  program: Program;
  reportedBy: { id: string; fullName: string; role: Role };
  assignedTo?: { id: string; fullName: string; email: string; role: Role } | null;
  events?: ReclamationEvent[];
}

export interface PaginatedReclamations {
  items: Reclamation[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardMonthlyStat {
  month: string;
  count: number;
}

export interface DashboardCategoryStat {
  category: ReclamationCategory;
  count: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  statusSummary: Record<ReclamationStatus, number>;
  categories: DashboardCategoryStat[];
  monthly: DashboardMonthlyStat[];
  topCategory: DashboardCategoryStat | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  mustChangePassword: boolean;
}

export interface CreateReclamationDto {
  roomId: string;
  programId: string;
  category: ReclamationCategory;
  priority?: Priority;
  description: string;
}

export interface UpdateStatusDto {
  status: ReclamationStatus;
  comment?: string;
}

export interface AssignReclamationDto {
  assignedToId?: string | null;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  role: Role;
  buildingId?: string | null;
  programId?: string | null;
  password?: string;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface ReclamationFilters {
  status?: ReclamationStatus;
  category?: ReclamationCategory;
  buildingId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export type AuditAction =
  | 'LOGIN'
  | 'CREATE_RECLAMATION'
  | 'UPDATE_STATUS'
  | 'ASSIGN_RECLAMATION'
  | 'UNASSIGN_RECLAMATION'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'IMPORT_USERS';

export interface AuditLog {
  id: string;
  userId: string | null;
  user: { id: string; fullName: string; email: string; role: Role } | null;
  action: AuditAction | string;
  entity: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

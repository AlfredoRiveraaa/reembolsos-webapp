import { UserRole } from './auth.model';

export interface SystemUser {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dias_asignados?: string;
  solicitudes_revisadas?: number;
}

export interface CreateSystemUserRequest {
  username: string;
  displayName: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  dias_asignados?: string;
}

export interface UpdateSystemUserRequest {
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
  dias_asignados?: string;
}

export interface UserOperationResult {
  ok: boolean;
  message: string;
}

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
}

export interface CreateSystemUserRequest {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateSystemUserRequest {
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export interface UserOperationResult {
  ok: boolean;
  message: string;
}

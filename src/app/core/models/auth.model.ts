export interface LoginCredentials {
  username: string;
  password: string;
}

export type UserRole = 'admin' | 'trabajador';

export interface RegisterUserRequest {
  username: string;
  fullName: string;
  role: UserRole;
  password: string;
}

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
}

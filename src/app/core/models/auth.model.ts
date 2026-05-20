export interface LoginCredentials {
  username: string;
  password: string;
}

export type UserRole = 'admin' | 'admin_rh' | 'trabajador';

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

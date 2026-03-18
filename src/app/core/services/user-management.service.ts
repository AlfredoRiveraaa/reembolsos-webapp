import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser, LoginCredentials, UserRole } from '../models/auth.model';
import {
  CreateSystemUserRequest,
  SystemUser,
  UpdateSystemUserRequest,
  UserOperationResult
} from '../models/user-management.model';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private static readonly STORAGE_KEY = 'reembolsos.auth.users';

  private readonly seedUsers: SystemUser[] = [
    {
      id: 'USR-1',
      username: 'ADMIN001',
      displayName: 'RH Usuario',
      password: 'BUAP2026',
      role: 'admin',
      isActive: true,
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'USR-2',
      username: 'TRAB1001',
      displayName: 'Ana Martinez',
      password: 'Trab1234',
      role: 'trabajador',
      isActive: true,
      createdAt: '2026-01-05T08:00:00.000Z',
      updatedAt: '2026-01-05T08:00:00.000Z'
    },
    {
      id: 'USR-3',
      username: 'TRAB1002',
      displayName: 'Luis Sandoval',
      password: 'Seguri123',
      role: 'trabajador',
      isActive: false,
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z'
    }
  ];

  private readonly usersSubject = new BehaviorSubject<SystemUser[]>(this.restoreUsers());
  readonly users$ = this.usersSubject.asObservable();

  authenticate(credentials: LoginCredentials): UserOperationResult & { user?: AuthUser } {
    const username = this.normalizeUsername(credentials.username);
    const password = credentials.password.trim();

    const user = this.usersSubject.value.find(
      currentUser => this.normalizeUsername(currentUser.username) === username && currentUser.password === password
    );

    if (!user) {
      return { ok: false, message: 'Usuario o contrasena incorrectos.' };
    }

    if (!user.isActive) {
      return { ok: false, message: 'Este usuario se encuentra inactivo. Solicita activacion al administrador.' };
    }

    return {
      ok: true,
      message: 'Autenticacion correcta.',
      user: this.toAuthUser(user)
    };
  }

  getUsersSnapshot(): SystemUser[] {
    return this.usersSubject.value.map(user => ({ ...user }));
  }

  createUser(payload: CreateSystemUserRequest): UserOperationResult {
    const username = this.normalizeUsername(payload.username);
    const users = this.usersSubject.value;

    if (users.some(user => this.normalizeUsername(user.username) === username)) {
      return { ok: false, message: 'El usuario ya existe. Usa un nombre de usuario diferente.' };
    }

    const timestamp = new Date().toISOString();
    const newUser: SystemUser = {
      id: this.generateUserId(),
      username,
      displayName: payload.displayName.trim(),
      password: payload.password.trim(),
      role: payload.role,
      isActive: payload.isActive,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.updateUsers([...users, newUser]);
    return { ok: true, message: 'Usuario creado correctamente.' };
  }

  updateUser(id: string, payload: UpdateSystemUserRequest, updatedByUsername: string): UserOperationResult {
    const users = this.usersSubject.value;
    const username = this.normalizeUsername(payload.username);
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return { ok: false, message: 'No se encontro el usuario seleccionado.' };
    }

    if (users.some(user => user.id !== id && this.normalizeUsername(user.username) === username)) {
      return { ok: false, message: 'El nombre de usuario ya esta en uso.' };
    }

    const userToUpdate = users[userIndex];
    if (!payload.isActive && this.normalizeUsername(userToUpdate.username) === this.normalizeUsername(updatedByUsername)) {
      return { ok: false, message: 'No puedes desactivar tu propia cuenta.' };
    }

    const nextRole: UserRole = payload.role;
    if (userToUpdate.role === 'admin' && nextRole !== 'admin' && this.getAdminCount(users) <= 1) {
      return { ok: false, message: 'Debe existir al menos un administrador activo en el sistema.' };
    }

    const updatedUser: SystemUser = {
      ...userToUpdate,
      username,
      displayName: payload.displayName.trim(),
      role: nextRole,
      isActive: payload.isActive,
      updatedAt: new Date().toISOString(),
      password: payload.password?.trim() ? payload.password.trim() : userToUpdate.password
    };

    const nextUsers = [...users];
    nextUsers[userIndex] = updatedUser;
    this.updateUsers(nextUsers);

    return { ok: true, message: 'Usuario actualizado correctamente.' };
  }

  deleteUser(id: string, deletedByUsername: string): UserOperationResult {
    const users = this.usersSubject.value;
    const userToDelete = users.find(user => user.id === id);

    if (!userToDelete) {
      return { ok: false, message: 'No se encontro el usuario seleccionado.' };
    }

    if (this.normalizeUsername(userToDelete.username) === this.normalizeUsername(deletedByUsername)) {
      return { ok: false, message: 'No puedes eliminar tu propia cuenta.' };
    }

    if (userToDelete.role === 'admin' && this.getAdminCount(users) <= 1) {
      return { ok: false, message: 'Debe existir al menos un administrador en el sistema.' };
    }

    const nextUsers = users.filter(user => user.id !== id);
    this.updateUsers(nextUsers);

    return { ok: true, message: 'Usuario eliminado correctamente.' };
  }

  private toAuthUser(user: SystemUser): AuthUser {
    return {
      username: user.username,
      displayName: user.displayName,
      role: user.role
    };
  }

  private updateUsers(users: SystemUser[]): void {
    this.usersSubject.next(users);
    localStorage.setItem(UserManagementService.STORAGE_KEY, JSON.stringify(users));
  }

  private restoreUsers(): SystemUser[] {
    const storedUsers = localStorage.getItem(UserManagementService.STORAGE_KEY);
    if (!storedUsers) {
      return this.seedUsers;
    }

    try {
      const parsedUsers = JSON.parse(storedUsers) as SystemUser[];
      if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
        return this.seedUsers;
      }

      return parsedUsers;
    } catch {
      localStorage.removeItem(UserManagementService.STORAGE_KEY);
      return this.seedUsers;
    }
  }

  private generateUserId(): string {
    const datePortion = Date.now();
    const randomPortion = Math.floor(Math.random() * 900 + 100);
    return `USR-${datePortion}-${randomPortion}`;
  }

  private normalizeUsername(username: string): string {
    return username.trim().toUpperCase();
  }

  private getAdminCount(users: SystemUser[]): number {
    return users.filter(user => user.role === 'admin').length;
  }
}

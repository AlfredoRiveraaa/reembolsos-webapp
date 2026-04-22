import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthUser, LoginCredentials } from '../models/auth.model';
import { UserManagementService } from './user-management.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly STORAGE_KEY = 'reembolsos.auth.user';

  private readonly currentUserSubject: BehaviorSubject<AuthUser | null>;
  readonly currentUser$;

  constructor(private readonly userManagementService: UserManagementService) {
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(this.restoreAndValidateSession());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    const authenticationResult = this.userManagementService.authenticate(credentials);

    if (!authenticationResult.ok || !authenticationResult.user) {
      return throwError(() => new Error(authenticationResult.message));
    }

    this.persistSession(authenticationResult.user);
    this.currentUserSubject.next(authenticationResult.user);

    return of(authenticationResult.user).pipe(delay(250));
  }

  logout(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  private persistSession(user: AuthUser): void {
    localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(user));
  }

  private restoreAndValidateSession(): AuthUser | null {
    const storedUser = localStorage.getItem(AuthService.STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as AuthUser;

      // Validar que el usuario exista en el sistema y esté activo
      const systemUsers = this.userManagementService.getUsersSnapshot();
      const exists = systemUsers.some(
        u => u.username === parsedUser.username && u.isActive
      );

      if (!exists) {
        // Sesión inválida o usuario inactivo
        localStorage.removeItem(AuthService.STORAGE_KEY);
        return null;
      }

      return parsedUser;
    } catch {
      localStorage.removeItem(AuthService.STORAGE_KEY);
      return null;
    }
  }
}

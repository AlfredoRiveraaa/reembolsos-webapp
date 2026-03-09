import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthUser, LoginCredentials } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly STORAGE_KEY = 'reembolsos.auth.user';

  private readonly mockCredentials = {
    username: 'rh.usuario',
    password: 'BUAP2026#'
  };

  private readonly mockUser: AuthUser = {
    username: 'rh.usuario',
    displayName: 'RH Usuario',
    role: 'Analista de Reembolsos'
  };

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.restoreSession());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginCredentials): Observable<AuthUser> {
    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password.trim();

    if (username !== this.mockCredentials.username || password !== this.mockCredentials.password) {
      return throwError(() => new Error('Usuario o contrasena incorrectos.'));
    }

    this.persistSession(this.mockUser);
    this.currentUserSubject.next(this.mockUser);

    return of(this.mockUser).pipe(delay(250));
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

  private restoreSession(): AuthUser | null {
    const storedUser = localStorage.getItem(AuthService.STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem(AuthService.STORAGE_KEY);
      return null;
    }
  }
}

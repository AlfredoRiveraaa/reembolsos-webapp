import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthUser, LoginCredentials } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly STORAGE_KEY = 'reembolsos.auth.user';
  private readonly apiUrl = 'http://localhost:8000/api';

  private http = inject(HttpClient);

  private readonly currentUserSubject: BehaviorSubject<AuthUser | null>;
  readonly currentUser$;

  constructor() {
    // 1. Inicializamos en null para prevenir errores
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // 2. Restauramos después de inicializar
    const session = this.restoreAndValidateSession();
    if (session) {
      this.currentUserSubject.next(session);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    const body = new HttpParams()
      .set('username', credentials.username)
      .set('password', credentials.password);

    return this.http.post<{access_token: string, token_type: string}>(
      `${this.apiUrl}/login`,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      map(response => {
        localStorage.setItem('access_token', response.access_token);

        const authUser: AuthUser = {
          username: credentials.username,
          displayName: 'Administrador RH',
          role: 'admin'
        };

        this.persistSession(authUser);
        this.currentUserSubject.next(authUser);

        return authUser;
      }),
      catchError(error => {
        const errorMsg = error.error?.detail || 'Error al iniciar sesión';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('access_token') !== null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  private persistSession(user: AuthUser): void {
    localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(user));
  }

  private restoreAndValidateSession(): AuthUser | null {
    const storedUser = localStorage.getItem(AuthService.STORAGE_KEY);
    const token = localStorage.getItem('access_token');

    if (!storedUser || !token) {
      this.clearStorage();
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      this.clearStorage();
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
    localStorage.removeItem('access_token');
  }
}

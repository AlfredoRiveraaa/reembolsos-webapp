import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthUser, LoginCredentials } from '../models/auth.model';

interface LoginResponse {
  access_token: string;
  token_type: string;
  username?: string;
  displayName?: string;
  role?: AuthUser['role'];
}

// 1. Agregamos esta interfaz para que TypeScript conozca qué trae el token
interface JwtPayload {
  sub?: string;
  rol?: string;
  role?: string;
  displayName?: string;
  name?: string;
  [key: string]: unknown;
}

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

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      map(response => {
        localStorage.setItem('access_token', response.access_token);

        const tokenPayload = this.decodeJwtPayload(response.access_token);

        const role = (tokenPayload.role ?? tokenPayload.rol ?? response.role ?? 'trabajador') as AuthUser['role'];

        const authUser: AuthUser = {
          username: response.username ?? tokenPayload.sub ?? credentials.username,
          displayName: response.displayName ?? tokenPayload.displayName ?? tokenPayload.name ?? 'Usuario',
          role: role
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

  recuperarPassword(username: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/recuperar-password`, { username });
  }

  cambiarPassword(password_actual: string, password_nueva: string): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(`${this.apiUrl}/usuarios/me/password`, { password_actual, password_nueva });
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
      const user = JSON.parse(storedUser) as AuthUser;

      // --- NUEVA VALIDACIÓN ROBUSTA ---
      // Nunca confiamos en el texto viejo, extraemos la verdad absoluta del token actual
      const tokenPayload = this.decodeJwtPayload(token);
      const realRole = (tokenPayload.role ?? tokenPayload.rol ?? 'trabajador') as AuthUser['role'];

      // Si el rol viejo guardado en memoria es diferente al real del token, lo corregimos
      if (user.role !== realRole) {
        user.role = realRole;
        this.persistSession(user); // Guardamos la corrección
      }

      return user;
    } catch {
      this.clearStorage();
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
    localStorage.removeItem('access_token');
  }

  // 2. Cambiamos el tipo de retorno para que TypeScript sepa qué esperar
  private decodeJwtPayload(token: string): JwtPayload {
    const payloadPart = token.split('.')[1];

    if (!payloadPart) {
      return {};
    }

    const base64Url = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = decodeURIComponent(
      atob(base64Url)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    try {
      return JSON.parse(base64) as JwtPayload;
    } catch {
      return {};
    }
  }
}

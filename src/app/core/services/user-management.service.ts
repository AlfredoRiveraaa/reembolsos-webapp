import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
  private readonly apiUrl = 'http://127.0.0.1:8000/api/usuarios';
  private readonly http = inject(HttpClient);

  private readonly usersSubject = new BehaviorSubject<SystemUser[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  loadUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[] | { users: SystemUser[] }>(this.apiUrl).pipe(
      map(response => Array.isArray(response) ? response : response.users ?? []),
      tap(users => this.usersSubject.next(users)),
      catchError(() => {
        this.usersSubject.next([]);
        return of([]);
      })
    );
  }

  getUsersSnapshot(): SystemUser[] {
    return this.usersSubject.value.map(user => ({ ...user }));
  }

  createUser(payload: CreateSystemUserRequest): Observable<UserOperationResult> {
    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => {
        void this.loadUsers().subscribe();
      }),
      map(() => ({ ok: true, message: 'Usuario creado correctamente.' })),
      catchError((error: { error?: { detail?: string } }) => of({
        ok: false,
        message: error.error?.detail || 'No se pudo crear el usuario.'
      }))
    );
  }

  updateUser(id: string, payload: UpdateSystemUserRequest): Observable<UserOperationResult> {
    return this.http.put(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => {
        void this.loadUsers().subscribe();
      }),
      map(() => ({ ok: true, message: 'Usuario actualizado correctamente.' })),
      catchError((error: { error?: { detail?: string } }) => of({
        ok: false,
        message: error.error?.detail || 'No se pudo actualizar el usuario.'
      }))
    );
  }

  deleteUser(id: string): Observable<UserOperationResult> {
    return this.http.delete<UserOperationResult>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        void this.loadUsers().subscribe();
      }),
      catchError((error: any) => of({
        ok: false,
        message: error.error?.detail || error.error?.message || 'No se pudo eliminar el usuario.'
      }))
    );
  }
}

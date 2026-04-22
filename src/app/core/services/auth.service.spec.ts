import { fakeAsync, tick } from '@angular/core/testing';
import { AuthUser } from '../models/auth.model';
import { SystemUser } from '../models/user-management.model';
import { MOCK_DEFAULT_CREDENTIALS } from '../mocks/users.mock';
import { AuthService } from './auth.service';
import { UserManagementService } from './user-management.service';

const AUTH_STORAGE_KEY = 'reembolsos.auth.user';
const USERS_STORAGE_KEY = 'reembolsos.auth.users';

function createAuthService(): { authService: AuthService; userManagementService: UserManagementService } {
  const userManagementService = new UserManagementService();
  const authService = new AuthService(userManagementService);

  return { authService, userManagementService };
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('logs in with valid credentials and persists session', fakeAsync(() => {
    const { authService } = createAuthService();
    let authenticatedUser: AuthUser | undefined;

    authService.login({
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      password: MOCK_DEFAULT_CREDENTIALS.admin.password
    }).subscribe(user => {
      authenticatedUser = user;
    });

    tick(260);

    expect(authenticatedUser).toBeTruthy();
    expect(authenticatedUser?.username).toBe(MOCK_DEFAULT_CREDENTIALS.admin.username);
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.getCurrentUser()?.role).toBe('admin');

    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    expect(storedSession).not.toBeNull();
  }));

  it('rejects login with incorrect password', () => {
    const { authService } = createAuthService();
    let errorMessage = '';

    authService.login({
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      password: 'Invalid123'
    }).subscribe({
      next: () => {
        throw new Error('Expected login to fail with incorrect password.');
      },
      error: (error: Error) => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain('incorrectos');
    expect(authService.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('rejects login for inactive users', () => {
    const { authService } = createAuthService();
    let errorMessage = '';

    authService.login({
      username: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.username,
      password: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.password
    }).subscribe({
      next: () => {
        throw new Error('Expected login to fail for inactive user.');
      },
      error: (error: Error) => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain('inactivo');
    expect(authService.isAuthenticated()).toBeFalse();
  });

  it('clears session on logout', fakeAsync(() => {
    const { authService } = createAuthService();

    authService.login({
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      password: MOCK_DEFAULT_CREDENTIALS.admin.password
    }).subscribe();

    tick(260);
    expect(authService.isAuthenticated()).toBeTrue();

    authService.logout();

    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  }));

  it('restores valid persisted session when user exists and is active', () => {
    const activeUsers: SystemUser[] = [
      {
        id: 'USR-1',
        username: MOCK_DEFAULT_CREDENTIALS.admin.username,
        displayName: 'RH Usuario',
        password: MOCK_DEFAULT_CREDENTIALS.admin.password,
        role: 'admin',
        isActive: true,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-01-01T08:00:00.000Z'
      }
    ];

    const persistedSession: AuthUser = {
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      displayName: 'RH Usuario',
      role: 'admin'
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(activeUsers));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistedSession));

    const { authService } = createAuthService();

    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.getCurrentUser()).toEqual(persistedSession);
  });

  it('invalidates persisted session when user is inactive', () => {
    const inactiveUsers: SystemUser[] = [
      {
        id: 'USR-1',
        username: MOCK_DEFAULT_CREDENTIALS.admin.username,
        displayName: 'RH Usuario',
        password: MOCK_DEFAULT_CREDENTIALS.admin.password,
        role: 'admin',
        isActive: false,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-01-01T08:00:00.000Z'
      }
    ];

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(inactiveUsers));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      displayName: 'RH Usuario',
      role: 'admin'
    } as AuthUser));

    const { authService } = createAuthService();

    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('clears corrupted persisted session payloads', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{invalid-json');

    const { authService } = createAuthService();

    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

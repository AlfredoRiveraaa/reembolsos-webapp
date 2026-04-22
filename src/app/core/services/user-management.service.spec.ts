import { MOCK_DEFAULT_CREDENTIALS } from '../mocks/users.mock';
import { CreateSystemUserRequest, SystemUser, UpdateSystemUserRequest } from '../models/user-management.model';
import { UserManagementService } from './user-management.service';

const USERS_STORAGE_KEY = 'reembolsos.auth.users';

function createService(): UserManagementService {
  return new UserManagementService();
}

describe('UserManagementService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('authenticates with valid credentials', () => {
    const service = createService();

    const result = service.authenticate({
      username: ` ${MOCK_DEFAULT_CREDENTIALS.admin.username.toLowerCase()} `,
      password: MOCK_DEFAULT_CREDENTIALS.admin.password
    });

    expect(result.ok).toBeTrue();
    expect(result.user).toBeTruthy();
    expect(result.user?.username).toBe(MOCK_DEFAULT_CREDENTIALS.admin.username);
    expect(result.user?.role).toBe('admin');
  });

  it('rejects authentication with incorrect password', () => {
    const service = createService();

    const result = service.authenticate({
      username: MOCK_DEFAULT_CREDENTIALS.admin.username,
      password: 'WrongPassword1'
    });

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('incorrectos');
  });

  it('rejects authentication for inactive users', () => {
    const service = createService();

    const result = service.authenticate({
      username: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.username,
      password: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.password
    });

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('inactivo');
  });

  it('does not create users with duplicate username', () => {
    const service = createService();

    const duplicatePayload: CreateSystemUserRequest = {
      username: MOCK_DEFAULT_CREDENTIALS.admin.username.toLowerCase(),
      displayName: 'Otro Admin',
      password: 'Admin1234',
      role: 'admin',
      isActive: true
    };

    const result = service.createUser(duplicatePayload);

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('ya existe');
  });

  it('creates valid users and normalizes username/password input', () => {
    const service = createService();

    const payload: CreateSystemUserRequest = {
      username: '  trab9001  ',
      displayName: '  Usuario Nuevo  ',
      password: ' Pass1234 ',
      role: 'trabajador',
      isActive: true
    };

    const result = service.createUser(payload);
    const createdUser = service
      .getUsersSnapshot()
      .find(currentUser => currentUser.username === 'TRAB9001');

    expect(result.ok).toBeTrue();
    expect(createdUser).toBeTruthy();
    expect(createdUser?.displayName).toBe('Usuario Nuevo');
    expect(createdUser?.password).toBe('Pass1234');
    expect(createdUser?.isActive).toBeTrue();
  });

  it('does not allow deactivating own account', () => {
    const service = createService();
    const adminUser = service
      .getUsersSnapshot()
      .find(currentUser => currentUser.username === MOCK_DEFAULT_CREDENTIALS.admin.username);

    expect(adminUser).toBeTruthy();

    const payload: UpdateSystemUserRequest = {
      username: adminUser!.username,
      displayName: adminUser!.displayName,
      role: adminUser!.role,
      isActive: false
    };

    const result = service.updateUser(adminUser!.id, payload, adminUser!.username.toLowerCase());

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('desactivar tu propia cuenta');
  });

  it('does not allow demoting the last admin', () => {
    const service = createService();
    const adminUser = service
      .getUsersSnapshot()
      .find(currentUser => currentUser.username === MOCK_DEFAULT_CREDENTIALS.admin.username);

    expect(adminUser).toBeTruthy();

    const payload: UpdateSystemUserRequest = {
      username: adminUser!.username,
      displayName: adminUser!.displayName,
      role: 'trabajador',
      isActive: true
    };

    const result = service.updateUser(adminUser!.id, payload, MOCK_DEFAULT_CREDENTIALS.activeWorker.username);

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('al menos un administrador');
  });

  it('does not allow deleting own account', () => {
    const service = createService();
    const adminUser = service
      .getUsersSnapshot()
      .find(currentUser => currentUser.username === MOCK_DEFAULT_CREDENTIALS.admin.username);

    expect(adminUser).toBeTruthy();

    const result = service.deleteUser(adminUser!.id, adminUser!.username);

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('eliminar tu propia cuenta');
  });

  it('does not allow deleting the last admin', () => {
    const service = createService();
    const adminUser = service
      .getUsersSnapshot()
      .find(currentUser => currentUser.username === MOCK_DEFAULT_CREDENTIALS.admin.username);

    expect(adminUser).toBeTruthy();

    const result = service.deleteUser(adminUser!.id, MOCK_DEFAULT_CREDENTIALS.activeWorker.username);

    expect(result.ok).toBeFalse();
    expect(result.message).toContain('al menos un administrador');
  });

  it('restores users from localStorage when available', () => {
    const persistedUsers: SystemUser[] = [
      {
        id: 'USR-900',
        username: 'PERSIST900',
        displayName: 'Persisted User',
        password: 'Persist123',
        role: 'trabajador',
        isActive: true,
        createdAt: '2026-02-01T08:00:00.000Z',
        updatedAt: '2026-02-01T08:00:00.000Z'
      }
    ];

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(persistedUsers));

    const service = createService();
    const snapshot = service.getUsersSnapshot();

    expect(snapshot.length).toBe(1);
    expect(snapshot[0]).toEqual(persistedUsers[0]);
  });

  it('falls back to seed users and clears invalid localStorage payloads', () => {
    localStorage.setItem(USERS_STORAGE_KEY, '{invalid-json');

    const service = createService();
    const snapshot = service.getUsersSnapshot();

    expect(snapshot.length).toBeGreaterThan(0);
    expect(localStorage.getItem(USERS_STORAGE_KEY)).toBeNull();
  });
});

import { SystemUser } from '../models/user-management.model';

export const MOCK_DEFAULT_CREDENTIALS = {
  admin: {
    username: 'ADMIN001',
    password: 'Admin2026'
  },
  activeWorker: {
    username: 'TRAB1001',
    password: 'Trab1234'
  },
  inactiveWorker: {
    username: 'TRAB1002',
    password: 'Seguri123'
  }
} as const;

export const MOCK_USERS: SystemUser[] = [
  {
    id: 'USR-1',
    username: MOCK_DEFAULT_CREDENTIALS.admin.username,
    displayName: 'RH Usuario',
    password: MOCK_DEFAULT_CREDENTIALS.admin.password,
    role: 'admin',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'USR-2',
    username: MOCK_DEFAULT_CREDENTIALS.activeWorker.username,
    displayName: 'Ana Martinez',
    password: MOCK_DEFAULT_CREDENTIALS.activeWorker.password,
    role: 'trabajador',
    isActive: true,
    createdAt: '2026-01-05T08:00:00.000Z',
    updatedAt: '2026-01-05T08:00:00.000Z'
  },
  {
    id: 'USR-3',
    username: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.username,
    displayName: 'Luis Sandoval',
    password: MOCK_DEFAULT_CREDENTIALS.inactiveWorker.password,
    role: 'trabajador',
    isActive: false,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z'
  }
];

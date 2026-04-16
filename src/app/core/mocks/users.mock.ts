import { SystemUser } from '../models/user-management.model';

export const MOCK_USERS: SystemUser[] = [
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

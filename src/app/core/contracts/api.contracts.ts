import { LoginCredentials, RegisterUserRequest } from '../models/auth.model';
import { Reimbursement, ReimbursementDetail, ReimbursementStatus } from '../models/reimbursement.model';
import { CreateSystemUserRequest, SystemUser, UpdateSystemUserRequest } from '../models/user-management.model';

// Frontend contracts to align payloads before backend integration.
export interface ApiLoginRequest extends LoginCredentials {}

export interface ApiLoginResponse {
  token: string;
  username: string;
  displayName: string;
  role: 'admin' | 'admin_rh' | 'trabajador';
}

export interface ApiRegisterRequest extends RegisterUserRequest {
  adminPassword: string;
}

export interface ApiListUsersResponse {
  users: SystemUser[];
}

export interface ApiCreateUserRequest extends CreateSystemUserRequest {}

export interface ApiUpdateUserRequest extends UpdateSystemUserRequest {}

export interface ApiDeleteUserResponse {
  ok: boolean;
  message: string;
}

export interface ApiListReimbursementsResponse {
  reimbursements: Reimbursement[];
}

export interface ApiReimbursementDetailResponse {
  reimbursement: ReimbursementDetail;
}

export interface ApiUpdateReimbursementStatusRequest {
  status: ReimbursementStatus;
}

export interface ApiUpdateReimbursementStatusResponse {
  ok: boolean;
  message: string;
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { SystemUser, CreateSystemUserRequest, UpdateSystemUserRequest } from '../../../core/models/user-management.model';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss'
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  private static readonly ALPHANUMERIC_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  private readonly destroy$ = new Subject<void>();

  users: SystemUser[] = [];
  filteredUsers: SystemUser[] = [];

  // Filters
  searchTerm = '';
  roleFilter: UserRole | '' = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Statistics
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  adminUsers = 0;

  // Modal state
  showModal = false;
  isEditMode = false;
  selectedUserId: string | null = null;
  showPasswordEditing = false;
  showPasswordConfirm = false;

  // Form
  userForm;

  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';

  currentUserUsername = '';

  readonly roles: UserRole[] = ['admin', 'trabajador'];

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.userForm = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)]],
      passwordConfirm: [''],
      role: this.fb.nonNullable.control<UserRole>('trabajador'),
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.currentUserUsername = this.authService.getCurrentUser()?.username ?? '';
    this.loadUsers();
    this.userManagementService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUsers();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    this.users = this.userManagementService.getUsersSnapshot();
    this.calculateStats();
    this.applyFilters();
  }

  private calculateStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.inactiveUsers = this.users.filter(u => !u.isActive).length;
    this.adminUsers = this.users.filter(u => u.role === 'admin' && u.isActive).length;
  }

  applyFilters(): void {
    let filtered = [...this.users];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(term) ||
        u.displayName.toLowerCase().includes(term)
      );
    }

    if (this.roleFilter) {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    if (this.statusFilter === 'active') {
      filtered = filtered.filter(u => u.isActive);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.isActive);
    }

    this.filteredUsers = filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.showPasswordConfirm = false;
    this.userForm.reset({
      username: '',
      displayName: '',
      password: '',
      passwordConfirm: '',
      role: 'trabajador',
      isActive: true
    });
    this.userForm.get('password')?.setValidators([
      Validators.required,
      Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
    this.userForm.get('passwordConfirm')?.updateValueAndValidity();
    this.showModal = true;
    this.message = '';
  }

  openEditModal(user: SystemUser): void {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.showPasswordEditing = false;
    this.showPasswordConfirm = false;
    this.userForm.reset({
      username: user.username,
      displayName: user.displayName,
      password: '',
      passwordConfirm: '',
      role: user.role,
      isActive: user.isActive
    });
    this.userForm.get('password')?.setValidators([
      Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('passwordConfirm')?.setValidators([]);
    this.userForm.get('passwordConfirm')?.updateValueAndValidity();
    this.showModal = true;
    this.message = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
    this.message = '';
    this.showPasswordEditing = false;
    this.showPasswordConfirm = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.passwordsMatch()) {
      this.message = 'Las contraseñas no coinciden.';
      this.messageType = 'error';
      this.userForm.get('passwordConfirm')?.markAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();

    if (this.isEditMode && this.selectedUserId) {
      const updatePayload: UpdateSystemUserRequest = {
        username: formValue.username,
        displayName: formValue.displayName,
        role: formValue.role,
        isActive: formValue.isActive
      };

      if (formValue.password?.trim()) {
        updatePayload.password = formValue.password.trim();
      }

      const result = this.userManagementService.updateUser(
        this.selectedUserId,
        updatePayload,
        this.currentUserUsername
      );

      if (result.ok) {
        this.message = result.message;
        this.messageType = 'success';
        window.setTimeout(() => this.closeModal(), 1200);
      } else {
        this.message = result.message;
        this.messageType = 'error';
      }
    } else {
      const createPayload: CreateSystemUserRequest = {
        username: formValue.username,
        displayName: formValue.displayName,
        password: formValue.password.trim(),
        role: formValue.role,
        isActive: formValue.isActive
      };

      const result = this.userManagementService.createUser(createPayload);

      if (result.ok) {
        this.message = result.message;
        this.messageType = 'success';
        window.setTimeout(() => this.closeModal(), 1200);
      } else {
        this.message = result.message;
        this.messageType = 'error';
      }
    }
  }

  deleteUser(user: SystemUser): void {
    if (!confirm(`¿Eliminar usuario "${user.displayName}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    const result = this.userManagementService.deleteUser(user.id, this.currentUserUsername);

    this.message = result.message;
    this.messageType = result.ok ? 'success' : 'error';

    if (result.ok) {
      window.setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 3000);
    }
  }

  getRoleLabel(role: UserRole): string {
    return role === 'admin' ? 'Administrador' : 'Trabajador';
  }

  canDeleteUser(user: SystemUser): boolean {
    return user.username !== this.currentUserUsername;
  }

  findUserById(userId: string | null): SystemUser | undefined {
    if (!userId) return undefined;
    return this.userManagementService.getUsersSnapshot().find(u => u.id === userId);
  }

  canDeleteUserInModal(): boolean {
    if (!this.selectedUserId) return false;
    const user = this.findUserById(this.selectedUserId);
    return user ? this.canDeleteUser(user) : false;
  }

  hasError(fieldName: 'username' | 'displayName' | 'password' | 'passwordConfirm' | 'role' | 'isActive', error: string): boolean {
    const control = this.userForm.get(fieldName);
    return control ? control.touched && control.hasError(error) : false;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isCurrentUser(username: string): boolean {
    return username === this.currentUserUsername;
  }

  togglePasswordVisibility(): void {
    this.showPasswordEditing = !this.showPasswordEditing;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }

  passwordsMatch(): boolean {
    const password = this.userForm.get('password')?.value ?? '';
    const passwordConfirm = this.userForm.get('passwordConfirm')?.value ?? '';
    return !!(password && passwordConfirm && password === passwordConfirm);
  }
}

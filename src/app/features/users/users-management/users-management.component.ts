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

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

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

  // Form
  userForm;
  isSaving = false;

  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';

  currentUserUsername = '';

  // --- VARIABLES PARA EL MODAL DE ELIMINACIÓN ---
  showDeleteModal = false;
  userToDelete: SystemUser | null = null;
  deleteMessage = '';
  deleteMessageType: 'success' | 'error' | '' = '';
  isDeleting = false;

  readonly roles: UserRole[] = ['admin', 'trabajador'];

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.userForm = this.fb.nonNullable.group({
      username: ['', [Validators.required]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)]],
      role: this.fb.nonNullable.control<UserRole>('trabajador'),
      isActive: [true],
      dias: this.fb.nonNullable.group({
        1: [true], // Lunes
        2: [true], // Martes
        3: [true], // Miercoles
        4: [true], // Jueves
        5: [true], // Viernes
        6: [true], // Sabado
        7: [true] // Domingo
      })
    });
  }

  ngOnInit(): void {
    this.currentUserUsername = this.authService.getCurrentUser()?.username ?? '';
    this.userManagementService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
        this.calculateStats();
        this.applyFilters(false);
      });

    this.userManagementService
      .loadUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.inactiveUsers = this.users.filter(u => !u.isActive).length;
    this.adminUsers = this.users.filter(u => (u.role === 'admin' || u.role === 'admin_rh') && u.isActive).length;
  }

  applyFilters(resetPage = true): void {
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

    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));

    if (resetPage) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  get paginatedUsers(): SystemUser[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.userForm.reset({
      username: '',
      displayName: '',
      password: '',
      role: 'trabajador',
      isActive: true,
      dias: {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true
      }
    });
    // La contraseña ya no es requerida al crear
    this.userForm.get('password')?.setValidators([
      Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('dias')?.setValue({
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true
    });
    this.showModal = true;
    this.message = '';
  }

  openEditModal(user: SystemUser): void {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    this.showPasswordEditing = false;
    this.userForm.reset({
      username: user.username,
      displayName: user.displayName,
      password: '',
      role: user.role,
      isActive: user.isActive,
      dias: {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true
      }
    });
    this.userForm.get('password')?.setValidators([
      Validators.pattern(UsersManagementComponent.ALPHANUMERIC_PASSWORD_REGEX)
    ]);
    this.userForm.get('password')?.updateValueAndValidity();
    const assignDays = user.dias_asignados ? user.dias_asignados.split(',').map(d => d.trim()) : ['1', '2', '3', '4', '5', '6', '7'];
    this.userForm.get('dias')?.setValue({
      1: assignDays.includes('1'),
      2: assignDays.includes('2'),
      3: assignDays.includes('3'),
      4: assignDays.includes('4'),
      5: assignDays.includes('5'),
      6: assignDays.includes('6'),
      7: assignDays.includes('7')
    });
    this.showModal = true;
    this.message = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
    this.message = '';
    this.showPasswordEditing = false;
    this.isSaving = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.userForm.getRawValue();
    const diasObj = formValue.dias as Record<string, boolean>;
    const selectedDias = Object.keys(diasObj).filter(key => diasObj[key]).join(',');

    if (this.isEditMode && this.selectedUserId) {
      const updatePayload: UpdateSystemUserRequest = {
        username: formValue.username,
        displayName: formValue.displayName,
        role: formValue.role,
        isActive: formValue.isActive,
        dias_asignados: selectedDias
      };

      if (formValue.password?.trim()) {
        updatePayload.password = formValue.password.trim();
      }

      this.userManagementService.updateUser(
        this.selectedUserId,
        updatePayload
      ).pipe(takeUntil(this.destroy$)).subscribe(result => {
        this.isSaving = false;
        if (result.ok) {
          this.message = 'Usuario actualizado correctamente.';
          this.messageType = 'success';
          setTimeout(() => {
            const modalDialog = document.querySelector('.modal-dialog');
            if (modalDialog) modalDialog.scrollTop = 0;
          }, 10);
          window.setTimeout(() => this.closeModal(), 2500);
        } else {
          this.message = result.message;
          this.messageType = 'error';
          setTimeout(() => {
            const modalDialog = document.querySelector('.modal-dialog');
            if (modalDialog) modalDialog.scrollTop = 0;
          }, 10);
        }
      });
    } else {
      const createPayload: CreateSystemUserRequest = {
        username: formValue.username,
        displayName: formValue.displayName,
        role: formValue.role,
        isActive: formValue.isActive,
        dias_asignados: selectedDias
      };

      if (formValue.password?.trim()) {
        createPayload.password = formValue.password.trim();
      }

      this.userManagementService.createUser(createPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.isSaving = false;
          if (result.ok) {
            this.message = 'Usuario creado correctamente.';
            this.messageType = 'success';
            setTimeout(() => {
              const modalDialog = document.querySelector('.modal-dialog');
              if (modalDialog) modalDialog.scrollTop = 0;
            }, 10);
            window.setTimeout(() => this.closeModal(), 2500);
          } else {
            this.message = result.message;
            this.messageType = 'error';
            setTimeout(() => {
              const modalDialog = document.querySelector('.modal-dialog');
              if (modalDialog) modalDialog.scrollTop = 0;
            }, 10);
          }
        });
    }
  }

  // --- MÉTODOS DE ELIMINACIÓN ---
  openDeleteModal(user: SystemUser): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.deleteMessage = '';
    this.deleteMessageType = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deleteMessage = '';
    this.deleteMessageType = '';
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.isDeleting = true;
    this.userManagementService.deleteUser(this.userToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isDeleting = false;
          this.deleteMessageType = result.ok ? 'success' : 'error';

          if (result.ok) {
            // Alerta verde de éxito forzada
            this.deleteMessage = 'Usuario eliminado correctamente.';
            this.message = 'Usuario eliminado correctamente.';

            // Si tuvo éxito, cerramos el modal después de 2 segundos
            window.setTimeout(() => {
              this.closeDeleteModal();
              this.closeModal();
            }, 2000);
          } else {
            // Alerta roja de error forzada si el backend dice ok: false
            this.deleteMessage = 'No se puede eliminar porque el usuario tiene un historial de auditoría. Por favor, desactívalo desde la opción Editar.';
          }
        },
        error: (err) => {
          this.isDeleting = false;
          // Alerta roja de error forzada si el servidor lanza una excepción
          this.deleteMessage = 'No se puede eliminar porque el usuario tiene un historial de auditoría. Por favor, desactívalo desde la opción Editar.';
          this.deleteMessageType = 'error';
        }
      });
  }

  getRoleLabel(role: UserRole): string {
    if (role === 'admin' || role === 'admin_rh') {
      return role === 'admin_rh' ? 'Administrador RH' : 'Administrador';
    }

    return 'Trabajador';
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

  hasError(fieldName: 'username' | 'displayName' | 'password' | 'role' | 'isActive', error: string): boolean {
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

  getDiasArray(diasStr: string | undefined): {num: string, label: string}[] {
    if (!diasStr) return [];

    // Mapeo de números a iniciales de días
    const map: Record<string, string> = {
      '1': 'Lu', '2': 'Ma', '3': 'Mi', '4': 'Ju', '5': 'Vi', '6': 'Sá', '7': 'Do'
    };

    return diasStr.split(',')
      .map(d => d.trim())
      .filter(d => d)
      .map(d => ({ num: d, label: map[d] || d }));
  }
}

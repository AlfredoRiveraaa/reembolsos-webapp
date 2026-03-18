import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RegisterUserRequest, UserRole } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private static readonly ALPHANUMERIC_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  activeView: 'login' | 'register' = 'login';

  isSubmitting = false;
  authError = '';
  showPassword = false;
  registerSubmitting = false;
  registerMessage = '';
  showAdminPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showAdminPasswordModal = false;
  adminPasswordInput = '';
  adminPasswordError = '';
  isAdminPasswordSuccess = false;
  private pendingRegisterData: RegisterUserRequest | null = null;

  readonly loginForm;
  readonly registerForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userManagementService: UserManagementService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      password: ['', [Validators.required, Validators.pattern(LoginComponent.ALPHANUMERIC_PASSWORD_REGEX)]]
    });

    this.registerForm = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      fullName: ['', [Validators.required, Validators.minLength(4)]],
      role: this.fb.nonNullable.control<UserRole>('trabajador', { validators: [Validators.required] }),
      password: ['', [Validators.required, Validators.pattern(LoginComponent.ALPHANUMERIC_PASSWORD_REGEX)]],
      passwordConfirm: ['', [Validators.required]]
    });
  }

  setActiveView(view: 'login' | 'register'): void {
    this.activeView = view;
    this.authError = '';
    this.registerMessage = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = '';

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.isSubmitting = false;
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error: Error) => {
        this.authError = error.message || 'No fue posible iniciar sesion.';
        this.isSubmitting = false;
      }
    });
  }

  hasError(fieldName: 'username' | 'password', error: string): boolean {
    const control = this.loginForm.controls[fieldName];
    return control.touched && control.hasError(error);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid || !this.passwordsMatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.pendingRegisterData = this.registerForm.getRawValue() as RegisterUserRequest;
    this.showAdminPasswordModal = true;
    this.adminPasswordInput = '';
    this.adminPasswordError = '';
  }

  hasRegisterError(fieldName: 'username' | 'fullName' | 'role' | 'password' | 'passwordConfirm', error: string): boolean {
    const control = this.registerForm.controls[fieldName];
    return control.touched && control.hasError(error);
  }

  toggleAdminPasswordVisibility(): void {
    this.showAdminPassword = !this.showAdminPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const passwordConfirm = this.registerForm.get('passwordConfirm')?.value;
    return password === passwordConfirm;
  }

  submitAdminPassword(): void {
    this.adminPasswordError = '';

    if (!this.adminPasswordInput) {
      this.adminPasswordError = 'La contraseña del administrador es requerida.';
      return;
    }

    // Validar que la contraseña del admin sea correcta
    // Por ahora, aceptamos cualquier contraseña válida (8+ alfanuméricos)
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(this.adminPasswordInput)) {
      this.adminPasswordError = 'La contraseña debe tener mínimo 8 caracteres alfanuméricos.';
      return;
    }

    // Crear el usuario
    const payload = this.pendingRegisterData!;

    const createResult = this.userManagementService.createUser({
      username: (payload as any).username,
      displayName: payload.fullName,
      password: payload.password,
      role: payload.role,
      isActive: true
    });

    if (!createResult.ok) {
      this.adminPasswordError = createResult.message || 'Error al crear el usuario.';
      return;
    }

    // Mostrar estado de éxito en el modal
    this.isAdminPasswordSuccess = true;
    this.registerMessage = `¡Registro exitoso! Bienvenido ${payload.fullName}. Iniciando sesión...`;

    // Auto-login y navegación
    window.setTimeout(() => {
      this.authService.login({
        username: (payload as any).username,
        password: payload.password
      }).subscribe({
        next: () => {
          this.showAdminPasswordModal = false;
          this.isAdminPasswordSuccess = false;
          this.adminPasswordInput = '';
          this.registerMessage = '';
          this.registerForm.reset({
            username: '',
            fullName: '',
            role: 'trabajador',
            password: '',
            passwordConfirm: ''
          });
          this.pendingRegisterData = null;
          // Navegar al dashboard
          void this.router.navigateByUrl('/');
        },
        error: () => {
          this.adminPasswordError = 'Error al iniciar sesión. Por favor intenta nuevamente.';
          this.isAdminPasswordSuccess = false;
          this.showAdminPasswordModal = true;
        }
      });
    }, 1500);
  }

  private generateUsername(fullName: string): string {
    // Generar username a partir del nombre completo
    // Formato: INICIALES + número aleatorio
    // Ejemplo: Diego González Camaril -> DGCA001
    const words = fullName.trim().split(/\s+/);
    const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${initials}${randomNum}`;
  }

  cancelAdminPasswordModal(): void {
    if (!this.isAdminPasswordSuccess) {
      this.showAdminPasswordModal = false;
      this.adminPasswordInput = '';
      this.adminPasswordError = '';
      this.pendingRegisterData = null;
    }
  }

  private getRoleLabel(role: UserRole): string {
    return role === 'admin' ? 'Administrador' : 'Trabajador';
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isSubmitting = false;
  authError = '';
  forgotPasswordForm;
  showForgotPassword = false;
  successMessage = '';
  showPassword = false;

  readonly loginForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.forgotPasswordForm = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.email]]
    });
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
        this.authError = error.message || 'No fue posible iniciar sesión.';
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

  toggleForgotPassword(): void {
    this.showForgotPassword = !this.showForgotPassword;
    this.authError = '';
    this.successMessage = '';
    this.forgotPasswordForm.reset();
    this.loginForm.reset();
  }

  onSubmitRecovery(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.getRawValue().username;

    this.authService.recuperarPassword(email).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.authError = 'Hubo un error al intentar procesar la solicitud. Intenta más tarde.';
        console.error(err);
      }
    });
  }
}

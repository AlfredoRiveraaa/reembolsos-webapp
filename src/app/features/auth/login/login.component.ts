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
  showPassword = false;
  readonly loginForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
}

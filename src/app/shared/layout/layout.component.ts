import { Component, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private static readonly MOBILE_BREAKPOINT = 768;

  sidebarCollapsed = false;
  isMobileViewport = false;
  currentYear = new Date().getFullYear();
  isDropdownOpen = false;
  showPasswordModal = false;
  passwordMessage = '';
  passwordMessageType: 'success' | 'error' | '' = '';

  passwordForm!: FormGroup;

  // Flags to toggle visibility of password fields in the modal
  showPasswordCurrent = false;
  showPasswordNew = false;
  showPasswordConfirm = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.syncSidebarStateByViewport(true);

    this.passwordForm = this.fb.nonNullable.group({
      password_actual: ['', [Validators.required]],
      password_nueva: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmar: ['', [Validators.required]]
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncSidebarStateByViewport();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isDropdownOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeSidebarOnMobile(): void {
    if (this.isMobileViewport) {
      this.sidebarCollapsed = true;
    }
  }

  get isSidebarOpenMobile(): boolean {
    return this.isMobileViewport && !this.sidebarCollapsed;
  }

  get userDisplayName(): string {
    return this.authService.getCurrentUser()?.displayName ?? 'Usuario';
  }

  get isAdmin(): boolean {
    const role = this.authService.getCurrentUser()?.role;
    return role === 'admin' || role === 'admin_rh';
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.isDropdownOpen = false;
    this.passwordForm.reset();
    this.passwordMessage = '';
    this.passwordMessageType = '';
  }

  toggleShowPasswordCurrent(): void {
    this.showPasswordCurrent = !this.showPasswordCurrent;
  }

  toggleShowPasswordNew(): void {
    this.showPasswordNew = !this.showPasswordNew;
  }

  toggleShowPasswordConfirm(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.passwordMessage = '';
    this.passwordMessageType = '';
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password_actual, password_nueva, password_confirmar } = this.passwordForm.getRawValue();

    if (password_nueva !== password_confirmar) {
      this.passwordMessage = 'Las contraseñas nuevas no coinciden.';
      this.passwordMessageType = 'error';
      return;
    }

    this.authService.cambiarPassword(password_actual, password_nueva).subscribe({
      next: (res) => {
        if (res.ok) {
          this.passwordMessageType = 'success';
          this.passwordMessage = res.message;
          setTimeout(() => this.closePasswordModal(), 1500);
        } else {
          this.passwordMessageType = 'error';
          this.passwordMessage = res.message;
        }
      },
      error: () => {
        this.passwordMessageType = 'error';
        this.passwordMessage = 'Error de conexión. Inténtalo más tarde.';
      }
    });
  }

  logout(): void {
    this.isDropdownOpen = false;
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private syncSidebarStateByViewport(force = false): void {
    if (typeof window === 'undefined') {
      return;
    }

    const isMobile = window.innerWidth <= LayoutComponent.MOBILE_BREAKPOINT;

    if (force || isMobile !== this.isMobileViewport) {
      this.isMobileViewport = isMobile;
      this.sidebarCollapsed = isMobile;
    }
  }
}

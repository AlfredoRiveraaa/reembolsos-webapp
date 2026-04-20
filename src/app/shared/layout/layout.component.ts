import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private static readonly MOBILE_BREAKPOINT = 768;

  sidebarCollapsed = false;
  isMobileViewport = false;
  currentYear = new Date().getFullYear();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.syncSidebarStateByViewport(true);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncSidebarStateByViewport();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  logout(): void {
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

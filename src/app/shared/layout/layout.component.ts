import { Component } from '@angular/core';
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
export class LayoutComponent {
  sidebarCollapsed = false;
  currentYear = new Date().getFullYear();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  get userDisplayName(): string {
    return this.authService.getCurrentUser()?.displayName ?? 'Usuario';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import {
  ACTIVE_REIMBURSEMENT_STATUSES,
  Reimbursement,
  ReimbursementFilters,
  ReimbursementStatus
} from '../../../core/models/reimbursement.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Inyección de dependencias moderna (Angular 19)
  private reimbursementService = inject(ReimbursementService);
  private router = inject(Router);

  // --- NUEVO: Temporizador para la recarga en tiempo real ---
  private pollingSubscription?: Subscription;

  reimbursements: Reimbursement[] = [];
  filteredReimbursements: Reimbursement[] = [];

  // Sincronizado con ReimbursementFilters
  filters: ReimbursementFilters = { nombre_solicitante: '', estatus: '', id_trabajador: '' };

  totalSolicitudes = 0;
  solicitudesPendientes = 0;
  solicitudesEnRevision = 0;
  solicitudesInfoSolicitada = 0;

  // Paginacion
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;

  today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  estados: ReimbursementStatus[] = [...ACTIVE_REIMBURSEMENT_STATUSES];

  ngOnInit(): void {
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private iniciarPolling(): void {
    this.pollingSubscription = interval(15000)
      .pipe(
        startWith(0),
        switchMap(() => this.reimbursementService.getReimbursements())
      )
      .subscribe({
        next: (data) => {
          this.reimbursements = data.filter(r => ACTIVE_REIMBURSEMENT_STATUSES.includes(r.estatus));
          this.applyFilters(false);
          this.calculateStats();
        },
        error: (err) => {
          console.error('Error recargando el dashboard en tiempo real:', err);
        }
      });
  }

  private calculateStats(): void {
    this.totalSolicitudes = this.reimbursements.length;
    this.solicitudesPendientes = this.reimbursements.filter(r => r.estatus === 'PENDIENTE').length;
    this.solicitudesEnRevision = this.reimbursements.filter(r => r.estatus === 'EN REVISIÓN').length;
    this.solicitudesInfoSolicitada = this.reimbursements.filter(r => r.estatus === 'INFO_SOLICITADA').length;
  }

  applyFilters(resetPage = true): void {
    this.filteredReimbursements = this.reimbursements.filter(r => {
      if (this.filters.nombre_solicitante && !r.nombre_solicitante.toLowerCase().includes(this.filters.nombre_solicitante.toLowerCase())) return false;
      if (this.filters.estatus && r.estatus !== this.filters.estatus) return false;
      if (this.filters.id_trabajador && (!r.id_trabajador || !r.id_trabajador.toLowerCase().includes(this.filters.id_trabajador.toLowerCase()))) return false;
      return true;
    }).sort((a, b) =>
      new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime() ||
      b.id - a.id
    );

    this.totalPages = Math.max(1, Math.ceil(this.filteredReimbursements.length / this.itemsPerPage));

    if (resetPage) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  clearFilters(): void {
    this.filters = { nombre_solicitante: '', estatus: '', id_trabajador: '' };
    this.applyFilters();
  }

  get paginatedReimbursements(): Reimbursement[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredReimbursements.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getEstadoClass(estatus: ReimbursementStatus): string {
    const map: Record<ReimbursementStatus, string> = {
      'APROBADO': 'estado-aprobado',
      'PENDIENTE': 'estado-pendiente',
      'EN REVISIÓN': 'estado-revision',
      'RECHAZADO': 'estado-rechazado',
      'INFO_SOLICITADA': 'estado-info'
    };
    return map[estatus] ?? 'estado-default';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getLastReviewDisplay(reimbursement: Reimbursement): string {
    const reviewDate =
      reimbursement.fecha_ultima_revision ??
      reimbursement.ultima_revision ??
      reimbursement.fecha_ultima_apertura ??
      reimbursement.fecha_revision;

    return reviewDate ? this.formatDate(reviewDate) : '—';
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/reembolso', id], { queryParams: { returnUrl: '/' } });
  }
}

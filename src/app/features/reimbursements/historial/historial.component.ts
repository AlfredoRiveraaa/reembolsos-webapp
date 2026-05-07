import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { Reimbursement, ReimbursementStatus } from '../../../core/models/reimbursement.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  private reimbursementService = inject(ReimbursementService);
  private router = inject(Router);

  reimbursements: Reimbursement[] = [];
  filteredReimbursements: Reimbursement[] = [];

  // Filtros
  fechaInicio = '';
  fechaFin = '';
  searchTerm = '';
  estadoFilter = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Estadísticas
  totalAprobados = 0;
  totalRechazados = 0;
  totalPendientes = 0;
  montoTotalAprobado = 0;

  estados: ReimbursementStatus[] = ['APROBADO', 'PENDIENTE', 'EN REVISIÓN', 'RECHAZADO'];

  ngOnInit(): void {
    this.loadHistorial();
  }

  private loadHistorial(): void {
    this.reimbursementService.getReimbursements().subscribe(data => {
      this.reimbursements = data;
      this.calculateStats();
      this.applyFilters();
    });
  }

  private calculateStats(): void {
    // Sincronización con las propiedades del modelo Reimbursement[cite: 9]
    this.totalAprobados = this.reimbursements.filter(r => r.estatus === 'APROBADO').length;
    this.totalRechazados = this.reimbursements.filter(r => r.estatus === 'RECHAZADO').length;
    this.totalPendientes = this.reimbursements.filter(r => r.estatus === 'PENDIENTE' || r.estatus === 'EN REVISIÓN').length;
    this.montoTotalAprobado = this.reimbursements
      .filter(r => r.estatus === 'APROBADO')
      .reduce((sum, r) => sum + Number(r.monto), 0);
  }

  applyFilters(): void {
    let filtered = [...this.reimbursements];

    // Filtro por rango de fechas
    if (this.fechaInicio) {
      filtered = filtered.filter(r => r.fecha_recepcion >= this.fechaInicio);
    }
    if (this.fechaFin) {
      filtered = filtered.filter(r => r.fecha_recepcion <= this.fechaFin);
    }

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.uuid.toLowerCase().includes(term) ||
        r.nombre_solicitante.toLowerCase().includes(term) ||
        r.correo_solicitante.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.estadoFilter) {
      filtered = filtered.filter(r => r.estatus === this.estadoFilter);
    }

    filtered.sort((a, b) => new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime());

    this.filteredReimbursements = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.searchTerm = '';
    this.estadoFilter = '';
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

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'APROBADO':
        return 'estado-aprobado';
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'EN REVISIÓN':
        return 'estado-revision';
      case 'RECHAZADO':
        return 'estado-rechazado';
      default:
        return 'estado-default';
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  exportHistorial(): void {
    console.log('Exportando historial...');
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/reembolso', id]);
  }
}

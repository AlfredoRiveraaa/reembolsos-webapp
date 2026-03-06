import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { Reimbursement } from '../../../core/models/reimbursement.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
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

  estados = ['Aprobado', 'Pendiente', 'En revisión', 'Rechazado'];

  constructor(private reimbursementService: ReimbursementService) {}

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
    this.totalAprobados = this.reimbursements.filter(r => r.estado === 'Aprobado').length;
    this.totalRechazados = this.reimbursements.filter(r => r.estado === 'Rechazado').length;
    this.totalPendientes = this.reimbursements.filter(r => r.estado === 'Pendiente' || r.estado === 'En revisión').length;
    this.montoTotalAprobado = this.reimbursements
      .filter(r => r.estado === 'Aprobado')
      .reduce((sum, r) => sum + r.total, 0);
  }

  applyFilters(): void {
    let filtered = [...this.reimbursements];

    // Filtro por rango de fechas
    if (this.fechaInicio) {
      filtered = filtered.filter(r => r.fecha >= this.fechaInicio);
    }
    if (this.fechaFin) {
      filtered = filtered.filter(r => r.fecha <= this.fechaFin);
    }

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.remitente.toLowerCase().includes(term) ||
        r.asunto.toLowerCase().includes(term) ||
        r.uuid.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.estadoFilter) {
      filtered = filtered.filter(r => r.estado === this.estadoFilter);
    }

    // Ordenar por fecha descendente (más reciente primero)
    filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

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
      case 'Aprobado':
        return 'estado-aprobado';
      case 'Pendiente':
        return 'estado-pendiente';
      case 'En revisión':
        return 'estado-revision';
      case 'Rechazado':
        return 'estado-rechazado';
      default:
        return 'estado-default';
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  exportHistorial(): void {
    console.log('Exportando historial...');
  }
}

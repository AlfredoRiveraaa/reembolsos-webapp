import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { Reimbursement, ReimbursementFilters, ReimbursementStatus } from '../../../core/models/reimbursement.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  reimbursements: Reimbursement[] = [];
  filteredReimbursements: Reimbursement[] = [];

  filters: ReimbursementFilters = {
    fecha: '',
    uuid: '',
    estado: ''
  };

  // Stats
  totalSolicitudesHoy = 0;
  solicitudesPendientes = 0;
  solicitudesRechazadas = 0;
  totalAcumulado = 0;

  estados: ReimbursementStatus[] = ['Aprobado', 'Pendiente', 'En revisión', 'Rechazado'];

  constructor(private reimbursementService: ReimbursementService) {}

  ngOnInit(): void {
    this.loadReimbursements();
    this.loadStats();
  }

  private loadReimbursements(): void {
    this.reimbursementService.getReimbursements().subscribe(data => {
      this.reimbursements = data;
      this.filteredReimbursements = data;
    });
  }

  private loadStats(): void {
    this.totalSolicitudesHoy = this.reimbursementService.getTotalSolicitudesHoy();
    this.solicitudesPendientes = this.reimbursementService.getSolicitudesPendientes();
    this.solicitudesRechazadas = this.reimbursementService.getSolicitudesRechazadas();
    this.totalAcumulado = this.reimbursementService.getTotalAcumulado();
  }

  applyFilters(): void {
    this.filteredReimbursements = this.reimbursements.filter(r => {
      if (this.filters.fecha && !r.fecha.includes(this.filters.fecha)) return false;
      if (this.filters.uuid && !r.uuid.toLowerCase().includes(this.filters.uuid.toLowerCase())) return false;
      if (this.filters.estado && r.estado !== this.filters.estado) return false;
      return true;
    });
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
    return new Date(dateString).toLocaleDateString('es-MX');
  }

  truncateUUID(uuid: string): string {
    return uuid.substring(0, 18) + '...';
  }

  exportData(): void {
    // Implementar exportación de datos
    console.log('Exportando datos...');
  }
}

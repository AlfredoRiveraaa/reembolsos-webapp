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

  filters: ReimbursementFilters = { fecha: '', uuid: '', estado: '' };

  totalSolicitudesHoy = 0;
  solicitudesPendientes = 0;
  solicitudesRechazadas = 0;
  totalAcumulado = 0;

  today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

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

  clearFilters(): void {
    this.filters = { fecha: '', uuid: '', estado: '' };
    this.applyFilters();
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Aprobado': 'estado-aprobado',
      'Pendiente': 'estado-pendiente',
      'En revisión': 'estado-revision',
      'Rechazado': 'estado-rechazado',
    };
    return map[estado] ?? 'estado-default';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  exportData(): void {
    console.log('Exportando datos…');
  }
}

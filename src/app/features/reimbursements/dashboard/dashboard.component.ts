import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import * as XLSX from 'xlsx';
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
  // Inyección de dependencias moderna (Angular 19)
  private reimbursementService = inject(ReimbursementService);
  private router = inject(Router);

  reimbursements: Reimbursement[] = [];
  filteredReimbursements: Reimbursement[] = [];

  // Sincronizado con ReimbursementFilters
  filters: ReimbursementFilters = { uuid: '', nombre_solicitante: '', estatus: '' };

  totalSolicitudesHoy = 0;
  solicitudesPendientes = 0;
  solicitudesRechazadas = 0;
  totalAcumulado = 0;

  today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  // Sincronizado con ReimbursementStatus (MAYÚSCULAS)[cite: 1, 9]
  estados: ReimbursementStatus[] = ['APROBADO', 'PENDIENTE', 'EN REVISIÓN', 'RECHAZADO'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.reimbursementService.getReimbursements().subscribe(data => {
      this.reimbursements = data;
      this.filteredReimbursements = data;
      this.calculateStats(); // Las estadísticas ahora se calculan con datos reales
    });
  }

  private calculateStats(): void {
    const stats = this.reimbursementService.getStats(this.reimbursements);
    this.totalSolicitudesHoy = stats.total;
    this.solicitudesPendientes = stats.pendientes;
    this.solicitudesRechazadas = stats.rechazados;
    this.totalAcumulado = stats.acumulado;
  }

  applyFilters(): void {
    this.filteredReimbursements = this.reimbursements.filter(r => {
      // Cambio de folioDRH -> uuid y nombreTrabajador -> nombre_solicitante
      if (this.filters.uuid && !r.uuid.toLowerCase().includes(this.filters.uuid.toLowerCase())) return false;
      if (this.filters.nombre_solicitante && !r.nombre_solicitante.toLowerCase().includes(this.filters.nombre_solicitante.toLowerCase())) return false;
      if (this.filters.estatus && r.estatus !== this.filters.estatus) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.filters = { uuid: '', nombre_solicitante: '', estatus: '' };
    this.applyFilters();
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

  exportData(): void {
    const rows = this.filteredReimbursements.length > 0 ? this.filteredReimbursements : this.reimbursements;
    const exportRows = rows.map(r => ({
      'Folio DRH': r.uuid,
      'Fecha Recepcion': r.fecha_recepcion,
      'Correo Solicitante': r.correo_solicitante,
      'Nombre Solicitante': r.nombre_solicitante,
      'Estatus': r.estatus,
      'Monto': r.monto,
      'Proveedor': r.nombre_proveedor,
      'Fecha Resolucion': r.fecha_resolucion || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reembolsos');
    XLSX.writeFile(workbook, `reembolsos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // El ID ahora es number
  navigateToDetail(id: number): void {
    this.router.navigate(['/reembolso', id]);
  }
}

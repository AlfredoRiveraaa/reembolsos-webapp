import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import {
  HISTORICAL_REIMBURSEMENT_STATUSES,
  Reimbursement,
  ReimbursementStatus
} from '../../../core/models/reimbursement.model';

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
  itemsPerPage = 20;
  totalPages = 1;

  // Estadísticas
  totalAprobados = 0;
  totalRechazados = 0;
  totalProcesadas = 0;
  montoTotalAprobado = 0;

  estados: ReimbursementStatus[] = [...HISTORICAL_REIMBURSEMENT_STATUSES];

  ngOnInit(): void {
    this.loadHistorial();
  }

  private loadHistorial(): void {
    this.reimbursementService.getReimbursements().subscribe(data => {
      this.reimbursements = data.filter(r => HISTORICAL_REIMBURSEMENT_STATUSES.includes(r.estatus));
      this.calculateStats();
      this.applyFilters();
    });
  }

  private calculateStats(): void {
    // Sincronización con las propiedades del modelo Reimbursement[cite: 9]
    this.totalAprobados = this.reimbursements.filter(r => r.estatus === 'APROBADO').length;
    this.totalRechazados = this.reimbursements.filter(r => r.estatus === 'RECHAZADO').length;
    this.totalProcesadas = this.totalAprobados + this.totalRechazados;
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
      case 'INFO_SOLICITADA':
        return 'estado-info';
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
    if (this.filteredReimbursements.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }

    // Mapeamos los datos para que las columnas del Excel tengan nombres bonitos en español
    const exportData = this.filteredReimbursements.map(r => ({
      'Folio DRH': r.uuid,
      'Fecha Recepción': this.formatDate(r.fecha_recepcion),
      'Correo Solicitante': r.correo_solicitante,
      'Nombre Trabajador': r.nombre_solicitante,
      'Observaciones': r.mensaje || '',
      'Proveedor / Hospital': r.nombre_proveedor,
      'Monto ($)': Number(r.monto), // Como número para que Excel pueda sumar
      'Fecha de Resolución': r.fecha_resolucion ? this.formatDate(r.fecha_resolucion) : '—',
      'Estado': r.estatus
    }));

    // Creamos la hoja de cálculo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 15 }, // Folio
      { wch: 15 }, // Fecha Rec
      { wch: 30 }, // Nombre
      { wch: 30 }, // Correo
      { wch: 35 }, // Proveedor
      { wch: 12 }, // Monto
      { wch: 15 }, // Estado
      { wch: 15 }, // Fecha Res
      { wch: 40 }, // Observaciones
    ];
    worksheet['!cols'] = columnWidths;

    // Creamos el libro (Workbook) y le añadimos la hoja
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial_Reembolsos');

    // Generamos el archivo y forzamos la descarga con la fecha actual
    const fechaArchivo = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Reporte_Reembolsos_${fechaArchivo}.xlsx`);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/reembolso', id], { queryParams: { returnUrl: '/historial' } });
  }
}

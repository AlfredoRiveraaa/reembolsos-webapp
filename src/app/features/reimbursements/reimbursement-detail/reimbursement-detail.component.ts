import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { ReimbursementDetail, ReimbursementStatus } from '../../../core/models/reimbursement.model';

@Component({
  selector: 'app-reimbursement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reimbursement-detail.component.html',
  styleUrl: './reimbursement-detail.component.scss'
})
export class ReimbursementDetailComponent implements OnInit {
  detalle: ReimbursementDetail | undefined;
  estadoActual: ReimbursementStatus = 'Pendiente';
  estadoOriginal: ReimbursementStatus = 'Pendiente';
  isLoading = true;
  notFound = false;

  /** Which PDF is open in the viewer (null = none) */
  activePdf: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private reimbursementService: ReimbursementService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReimbursement(id);
    } else {
      this.notFound = true;
      this.isLoading = false;
    }
  }

  private loadReimbursement(id: string): void {
    this.reimbursementService.getReimbursementById(id).subscribe(data => {
      if (data) {
        this.detalle = data;
        this.estadoActual = data.estado;
        this.estadoOriginal = data.estado;
      } else {
        this.notFound = true;
      }
      this.isLoading = false;
    });
  }

  previewPdf(n: number): void {
    this.activePdf = this.activePdf === n ? null : n;
  }

  cambiarEstado(nuevoEstado: ReimbursementStatus): void {
    if (this.detalle && this.estadoActual !== nuevoEstado) {
      this.reimbursementService.updateReimbursementStatus(this.detalle.id, nuevoEstado)
        .subscribe(success => {
          if (success) this.estadoActual = nuevoEstado;
        });
    }
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'Aprobado':   'estado-aprobado',
      'Pendiente':  'estado-pendiente',
      'En revisión':'estado-revision',
      'Rechazado':  'estado-rechazado',
    };
    return map[estado] ?? 'estado-default';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  calcularImporte(cantidad: number, precio: number): number {
    return cantidad * precio;
  }

  descargarXML(): void {
    console.log('Descargando XML…');
  }

  descargarPDF(numero: number): void {
    console.log(`Descargando PDF ${numero}…`);
  }
}

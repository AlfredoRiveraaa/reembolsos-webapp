import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { Reimbursement, ReimbursementStatus } from '../../../core/models/reimbursement.model';

type ViewerDocumentType = 'pdf' | 'txt';

interface ViewerDocument {
  id: string;
  name: string;
  subtitle: string;
  type: ViewerDocumentType;
  url: string;
  safeUrl: SafeResourceUrl;
  xmlContent?: string;
}

@Component({
  selector: 'app-reimbursement-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reimbursement-detail.component.html',
  styleUrl: './reimbursement-detail.component.scss'
})
export class ReimbursementDetailComponent implements OnInit {
  detalle: Reimbursement | undefined;
  estadoActual: ReimbursementStatus = 'PENDIENTE';
  estadoOriginal: ReimbursementStatus = 'PENDIENTE';
  isLoading = true;
  notFound = false;

  documents: ViewerDocument[] = [];
  activeDocumentId: string | null = null;

  // --- VARIABLES PARA EL FLUJO DE DECISION ---
  pendingAction: ReimbursementStatus | null = null;
  actionComment: string = '';
  isSubmittingStatus: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private reimbursementService: ReimbursementService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const idNumber = Number(idParam);
      this.loadReimbursement(idNumber);
    } else {
      this.notFound = true;
      this.isLoading = false;
    }
  }

  private loadReimbursement(id: number): void {
    this.reimbursementService.getReimbursementById(id).subscribe(data => {
      if (data) {
        this.detalle = data;
        this.estadoOriginal = data.estatus;

        // --- TRANSICIÓN AUTOMÁTICA ---
        if (data.estatus === 'PENDIENTE') {
          // 1. Lo cambiamos visualmente de inmediato
          this.estadoActual = 'EN REVISIÓN';

          // 2. Le avisamos al backend de forma silenciosa (sin comentarios extra)
          this.reimbursementService.updateReimbursementStatus(id, 'EN REVISIÓN').subscribe({
            error: (err) => console.error('Error al actualizar a En Revisión automáticamente', err)
          });
        } else {
          // Si ya estaba en revisión, aprobado o rechazado, lo dejamos como está
          this.estadoActual = data.estatus;
        }

        this.cargarArchivosExpediente(data.id);
      } else {
        this.notFound = true;
      }
      this.isLoading = false;
    });
  }

  // --- LOGICA DE INTERACCION ---
  iniciarCambioEstado(nuevoEstado: ReimbursementStatus): void {
    // Si ya esta en ese estado, no hacemos nada
    if (this.estadoActual === nuevoEstado) return;

    // Abrimos la caja de confirmacion
    this.pendingAction = nuevoEstado;
    this.actionComment = '';
  }

  cancelarAccion(): void {
    this.pendingAction = null;
    this.actionComment = '';
  }

  confirmarCambioEstado(): void {
    if (!this.detalle || !this.pendingAction) return;

    // Validacion: El rechazo obliga a escribir un motivo
    if (this.pendingAction === 'RECHAZADO' && !this.actionComment.trim()) {
      alert('Por favor, especifique un motivo para el rechazo.');
      return;
    }

    this.isSubmittingStatus = true;

    this.reimbursementService
      .updateReimbursementStatus(this.detalle.id, this.pendingAction, this.actionComment.trim())
      .subscribe({
        next: (updated) => {
          if (updated) {
            // Actualizamos la UI
            this.estadoActual = this.pendingAction!;
            this.detalle!.mensaje = this.actionComment.trim();

            // Cerramos la caja
            this.cancelarAccion();
          }
          this.isSubmittingStatus = false;
        },
        error: (err) => {
          console.error(err);
          alert('Hubo un error al actualizar el estado y enviar el correo.');
          this.isSubmittingStatus = false;
        }
      });
  }

  // --- LOGICA DE DOCUMENTOS
  toggleDocument(documentId: string): void {
    this.activeDocumentId = this.activeDocumentId === documentId ? null : documentId;

    if (this.activeDocumentId && this.detalle) {
      const activeDoc = this.documents.find(d => d.id === documentId);
      if (activeDoc && !activeDoc.url && !activeDoc.xmlContent) {
        this.reimbursementService.getDocumentBlob(this.detalle.id, documentId).subscribe({
          next: (blob) => {
            if (activeDoc.type === 'pdf') {
              const objectUrl = URL.createObjectURL(blob);
              activeDoc.url = objectUrl;
              activeDoc.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                activeDoc.xmlContent = reader.result as string;
              };
              reader.readAsText(blob);
            }
          },
          error: (err) => console.error(`Error cargando archivo ${documentId}`, err)
        });
      }
    }
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'APROBADO':   'estado-aprobado',
      'PENDIENTE':  'estado-pendiente',
      'EN REVISIÓN':'estado-revision',
      'RECHAZADO':  'estado-rechazado',
    };
    return map[estado] ?? 'estado-default';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  get activeDocument(): ViewerDocument | undefined {
    return this.activeDocumentId ? this.documents.find(d => d.id === this.activeDocumentId) : undefined;
  }

  descargarDocumentoActivo(): void {
    if (this.activeDocument) this.descargarDocumento(this.activeDocument);
  }

  descargarDocumento(viewerDocument: ViewerDocument): void {
    if (!this.detalle) return;
    this.reimbursementService.getDocumentBlob(this.detalle.id, viewerDocument.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = viewerDocument.id;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: () => window.open(viewerDocument.url, '_blank', 'noopener')
    });
  }

  private cargarArchivosExpediente(id: number): void {
    this.reimbursementService.listarArchivos(id).subscribe({
      next: (archivos: string[]) => {
        this.documents = archivos.map(archivo => {
          const isPdf = archivo.toLowerCase().endsWith('.pdf');
          return {
            id: archivo,
            name: archivo,
            subtitle: isPdf ? 'Documento PDF' : 'Documento XML / Anexo',
            type: isPdf ? 'pdf' : 'txt',
            url: '', safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(''), xmlContent: ''
          };
        });
        if (this.documents.length > 0) this.toggleDocument(this.documents[0].id);
      }
    });
  }
}

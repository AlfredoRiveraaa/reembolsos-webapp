import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { Reimbursement, ReimbursementStatus } from '../../../core/models/reimbursement.model';

type ViewerDocumentType = 'pdf' | 'txt';
type FormaPagoValue = string | number | null | undefined;

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
export class ReimbursementDetailComponent implements OnInit, OnDestroy {
  detalle: Reimbursement | undefined;
  estadoActual: ReimbursementStatus = 'PENDIENTE';
  estadoOriginal: ReimbursementStatus = 'PENDIENTE';
  estadoActualizadoMensaje: string | null = null;
  isLoading = true;
  notFound = false;
  returnUrl = '/';

  documents: ViewerDocument[] = [];
  activeDocumentId: string | null = null;
  isDocumentModalOpen = false;

  private readonly formaPagoLabels: Record<string, string> = {
    '01': 'Efectivo',
    '02': 'Cheque nominativo',
    '03': 'Transferencia electrónica de fondos',
    '04': 'Tarjeta de crédito',
    '05': 'Monedero electrónico',
    '06': 'Dinero electrónico',
    '08': 'Vales de despensa',
    '12': 'Dación en pago',
    '13': 'Pago por subrogación',
    '14': 'Pago por consignación',
    '15': 'Condonación',
    '17': 'Compensación',
    '23': 'Novación',
    '24': 'Confusión',
    '25': 'Remisión de deuda',
    '26': 'Prescripción o caducidad',
    '27': 'A satisfacción del acreedor',
    '28': 'Tarjeta de débito',
    '29': 'Tarjeta de servicios',
    '30': 'Aplicación de anticipos',
    '31': 'Intermediario pagos',
    '99': 'Por definir'
  };

  private readonly metodoPagoLabels: Record<string, string> = {
    PUE: 'Pago en una sola exhibición',
    PPD: 'Pago en parcialidades o diferido'
  };

  // --- VARIABLES PARA EL FLUJO DE DECISION ---
  pendingAction: ReimbursementStatus | null = null;
  actionComment: string = '';
  isSubmittingStatus: boolean = false;

  // --- VARIABLES PARA EL MODAL DE CONFLICTO ---
  showConflictModal: boolean = false;
  conflictMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reimbursementService: ReimbursementService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const idNumber = Number(idParam);
      this.loadReimbursement(idNumber);
    } else {
      this.notFound = true;
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.documents.forEach(document => {
      if (document.url) {
        URL.revokeObjectURL(document.url);
      }
    });
  }

  @HostListener('document:keydown.escape')
  closeActiveModal(): void {
    if (this.isDocumentModalOpen) {
      this.closeDocumentModal();
    }
  }

  private loadReimbursement(id: number): void {
    this.reimbursementService.getReimbursementById(id).subscribe({
      next: (data) => {
        if (data) {
          this.detalle = data;
          this.estadoOriginal = data.estatus;
          this.estadoActualizadoMensaje = null;

          // --- TRANSICIÓN AUTOMÁTICA ---
          if (data.estatus === 'PENDIENTE') {
            // 1. Lo cambiamos visualmente de inmediato para que el admin sepa que lo está leyendo
            this.estadoActual = 'EN REVISIÓN';

            // 2. Avisamos al backend de inmediato para que se refleje en el Dashboard de todos
            this.reimbursementService.updateReimbursementStatus(data.id, 'EN REVISIÓN', '').subscribe({
              error: (err) => console.error('Error al cambiar estado a En Revisión', err)
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
      },
      error: (err) => {
        console.error('Error al cargar la solicitud de reembolso:', err);
        this.notFound = true;
        this.isLoading = false;
      }
    });
  }

  // --- LOGICA DE INTERACCION ---
  iniciarCambioEstado(nuevoEstado: ReimbursementStatus): void {
    // Si ya esta en ese estado, no hacemos nada
    if (this.estadoActual === nuevoEstado) return;

    // Abrimos la caja de confirmacion
    this.estadoActualizadoMensaje = null;
    this.pendingAction = nuevoEstado;
    this.actionComment = '';
  }

  cancelarAccion(): void {
    this.pendingAction = null;
    this.actionComment = '';
  }

  closeConflictModal(): void {
    this.showConflictModal = false;
    this.router.navigate(['/']); // Regresa al panel principal
  }

  confirmarCambioEstado(): void {
    if (!this.detalle || !this.pendingAction) return;

    // Validaciones: El rechazo y las solicitudes de información requieren un comentario
    if (this.pendingAction === 'RECHAZADO' && !this.actionComment.trim()) {
      alert('Por favor, especifique un motivo para el rechazo.');
      return;
    }

    if (this.pendingAction === 'INFO_SOLICITADA' && !this.actionComment.trim()) {
      alert('Debe especificar qué información está solicitando.');
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
            this.estadoActualizadoMensaje = `Estado actualizado a "${this.estadoActual}"`;

            // Cerramos la caja
            this.cancelarAccion();
            this.router.navigate(['/']);
          }
          this.isSubmittingStatus = false;
        },
        error: (err) => {
          console.error(err);
          this.isSubmittingStatus = false; // Movimos esto arriba

          if (err.status === 409) {
            // En lugar del alert, llenamos el modal y lo mostramos
            this.conflictMessage = err.error?.detail || 'Esta solicitud ya fue procesada por otro compañero.';
            this.showConflictModal = true;
            this.cancelarAccion(); // Cerramos la cajita de comentarios
          } else {
            alert('Hubo un error al actualizar el estado y enviar el correo.');
          }
        }
      });
  }

  // --- LOGICA DE DOCUMENTOS
  toggleDocument(documentId: string): void {
    this.activeDocumentId = documentId;
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
      'INFO_SOLICITADA': 'estado-info'
    };
    return map[estado] ?? 'estado-default';
  }

  get puedeMostrarAcciones(): boolean {
    return this.estadoActual !== 'APROBADO' && this.estadoActual !== 'RECHAZADO';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getFormaPagoLabel(reimbursement: Reimbursement): string {
    return this.formatFormaPago(reimbursement.forma_pago ?? reimbursement.foma_pago);
  }

  getTipoPagoLabel(reimbursement: Reimbursement): string {
    return this.formatFormaPago(
      reimbursement.tipo_pago ??
      reimbursement.tipo_de_pago ??
      reimbursement.metodo_pago ??
      reimbursement.forma_pago ??
      reimbursement.foma_pago
    );
  }

  formatFormaPago(value: FormaPagoValue): string {
    const rawValue = String(value ?? '').trim();
    if (!rawValue || rawValue.toUpperCase() === 'NULL') {
      return 'No disponible';
    }

    const code = /^\d+$/.test(rawValue) ? rawValue.padStart(2, '0') : rawValue.toUpperCase();
    const label = this.formaPagoLabels[code] ?? this.metodoPagoLabels[code];
    return label ? `${code} - ${label}` : rawValue;
  }

  get activeDocument(): ViewerDocument | undefined {
    return this.activeDocumentId ? this.documents.find(d => d.id === this.activeDocumentId) : undefined;
  }

  descargarDocumentoActivo(): void {
    if (this.activeDocument) this.descargarDocumento(this.activeDocument);
  }

  openDocumentModal(documentId?: string): void {
    if (documentId) {
      this.toggleDocument(documentId);
    }

    if (this.activeDocument) {
      this.isDocumentModalOpen = true;
    }
  }

  closeDocumentModal(): void {
    this.isDocumentModalOpen = false;
  }

  descargarDocumento(viewerDocument: ViewerDocument): void {
    if (!this.detalle) return;
    this.reimbursementService.getDocumentBlob(this.detalle.id, viewerDocument.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = viewerDocument.name || viewerDocument.id;
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

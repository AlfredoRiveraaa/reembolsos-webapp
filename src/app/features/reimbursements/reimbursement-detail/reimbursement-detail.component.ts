import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReimbursementService } from '../../../core/services/reimbursement.service';
import { ReimbursementDetail, ReimbursementStatus } from '../../../core/models/reimbursement.model';

type ViewerDocumentType = 'pdf' | 'txt';

interface ViewerDocument {
  id: string;
  name: string;
  subtitle: string;
  type: ViewerDocumentType;
  url: string;
  safeUrl: SafeResourceUrl;
}

interface ReplyTemplate {
  id: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-reimbursement-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reimbursement-detail.component.html',
  styleUrl: './reimbursement-detail.component.scss'
})
export class ReimbursementDetailComponent implements OnInit {
  detalle: ReimbursementDetail | undefined;
  estadoActual: ReimbursementStatus = 'Pendiente';
  estadoOriginal: ReimbursementStatus = 'Pendiente';
  isLoading = true;
  notFound = false;

  documents: ViewerDocument[] = [];
  activeDocumentId: string | null = null;

  // Reply form
  replyOpen = false;
  replyTo = '';
  replyCC = '';
  replySubject = '';
  replyBody = '';
  replySent = false;
  selectedTemplateId = '';

  readonly replyTemplates: ReplyTemplate[] = [
    {
      id: 'acuse-recibido',
      label: 'Acuse de recibido',
      description: 'Confirma recepción y tiempo estimado de revisión.'
    },
    {
      id: 'solicitud-informacion',
      label: 'Solicitud de información adicional',
      description: 'Pide documentos o datos faltantes para continuar.'
    },
    {
      id: 'en-revision',
      label: 'Actualización: en revisión',
      description: 'Notifica que la solicitud sigue en validación.'
    },
    {
      id: 'aprobada',
      label: 'Solicitud aprobada',
      description: 'Confirma aprobación y próximos pasos.'
    },
    {
      id: 'rechazada',
      label: 'Solicitud rechazada',
      description: 'Informa rechazo y motivo general.'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private reimbursementService: ReimbursementService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initializeMockDocuments();

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
        this.initReplyForm(data);
      } else {
        this.notFound = true;
      }
      this.isLoading = false;
    });
  }

  toggleDocument(documentId: string): void {
    this.activeDocumentId = this.activeDocumentId === documentId ? null : documentId;
  }

  get activeDocument(): ViewerDocument | undefined {
    if (!this.activeDocumentId) {
      return undefined;
    }
    return this.documents.find(document => document.id === this.activeDocumentId);
  }

  get selectedTemplateDescription(): string {
    if (!this.selectedTemplateId) {
      return '';
    }

    return this.replyTemplates.find(template => template.id === this.selectedTemplateId)?.description ?? '';
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

  descargarDocumento(viewerDocument: ViewerDocument): void {
    fetch(viewerDocument.url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`No se pudo descargar el archivo: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = this.getFileNameFromUrl(viewerDocument.url);
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        // Fallback: if the browser blocks fetch/download, open the file URL.
        window.open(viewerDocument.url, '_blank', 'noopener');
      });
  }

  descargarDocumentoActivo(): void {
    const document = this.activeDocument;
    if (!document) {
      return;
    }

    this.descargarDocumento(document);
  }

  applyReplyTemplate(templateId: string): void {
    if (!this.detalle) {
      return;
    }

    this.selectedTemplateId = templateId;
    if (!templateId) {
      this.setDefaultReplySubject(this.detalle);
      this.replyBody = '';
      return;
    }

    const { subject, body } = this.getTemplateContent(templateId, this.detalle);
    this.replySubject = subject;
    this.replyBody = body;
    this.replySent = false;
  }

  private initReplyForm(data: ReimbursementDetail): void {
    this.replyTo = `${data.nombreTrabajador} <${data.idTrabajador.toLowerCase()}@universidad.edu.mx>`;
    this.setDefaultReplySubject(data);
    this.replyBody = '';
    this.replyCC = '';
    this.replySent = false;
    this.selectedTemplateId = '';
  }

  enviarRespuesta(): void {
    if (!this.replyBody.trim()) return;
    console.log('Enviando respuesta:', {
      para: this.replyTo,
      cc: this.replyCC,
      asunto: this.replySubject,
      cuerpo: this.replyBody,
    });
    this.replySent = true;
  }

  descartarRespuesta(): void {
    if (this.detalle) {
      this.initReplyForm(this.detalle);
    }
  }

  private initializeMockDocuments(): void {
    const baseDocuments = [
      {
        id: 'factura-txt',
        name: 'Factura TXT (simulación XML)',
        subtitle: 'Comprobante fiscal de ejemplo',
        type: 'txt' as const,
        url: '/mocks/archivosprueba/facturaEjemplo.txt'
      },
      {
        id: 'factura-pdf',
        name: 'PDF Representación',
        subtitle: 'Documento de ejemplo para visor',
        type: 'pdf' as const,
        url: '/mocks/archivosprueba/ArchivoEjemplo.pdf'
      }
    ];

    this.documents = baseDocuments.map(document => ({
      ...document,
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(document.url)
    }));
  }

  private getFileNameFromUrl(url: string): string {
    const urlWithoutQuery = url.split('?')[0] ?? url;
    const segments = urlWithoutQuery.split('/');
    return segments[segments.length - 1] || 'archivo';
  }

  private setDefaultReplySubject(data: ReimbursementDetail): void {
    this.replySubject = `Re: Solicitud de reembolso ${data.folioDRH} — ${data.nombreTrabajador}`;
  }

  private getTemplateContent(templateId: string, data: ReimbursementDetail): { subject: string; body: string } {
    const nombre = data.nombreTrabajador;
    const folio = data.folioDRH;

    const map: Record<string, { subject: string; body: string }> = {
      'acuse-recibido': {
        subject: `Acuse de recibido de solicitud ${folio}`,
        body:
          `Estimado(a) ${nombre},\n\n` +
          `Le confirmamos la recepción de su solicitud de reembolso con folio ${folio}.\n` +
          `Actualmente se encuentra en proceso de validación documental y fiscal.\n\n` +
          `Tiempo estimado de respuesta: 2 a 5 días hábiles.\n\n` +
          `Quedamos atentos a cualquier comentario.\n\n` +
          `Atentamente,\nDirección de Recursos Humanos`
      },
      'solicitud-informacion': {
        subject: `Información adicional requerida para folio ${folio}`,
        body:
          `Estimado(a) ${nombre},\n\n` +
          `Durante la revisión de su solicitud con folio ${folio}, detectamos que necesitamos información adicional para continuar el trámite.\n\n` +
          `Por favor comparta a este correo los documentos faltantes o la aclaración correspondiente en un plazo de 3 días hábiles.\n\n` +
          `En caso de dudas, con gusto le apoyamos.\n\n` +
          `Atentamente,\nDirección de Recursos Humanos`
      },
      'en-revision': {
        subject: `Estatus en revisión de solicitud ${folio}`,
        body:
          `Estimado(a) ${nombre},\n\n` +
          `Su solicitud de reembolso con folio ${folio} continúa en etapa de revisión.\n` +
          `Le notificaremos por este medio en cuanto se emita una resolución final.\n\n` +
          `Agradecemos su paciencia.\n\n` +
          `Atentamente,\nDirección de Recursos Humanos`
      },
      aprobada: {
        subject: `Solicitud aprobada: folio ${folio}`,
        body:
          `Estimado(a) ${nombre},\n\n` +
          `Le informamos que su solicitud de reembolso con folio ${folio} fue aprobada.\n` +
          `El proceso de pago continuará conforme a los tiempos administrativos establecidos.\n\n` +
          `Gracias por su colaboración.\n\n` +
          `Atentamente,\nDirección de Recursos Humanos`
      },
      rechazada: {
        subject: `Solicitud rechazada: folio ${folio}`,
        body:
          `Estimado(a) ${nombre},\n\n` +
          `Le informamos que su solicitud de reembolso con folio ${folio} fue rechazada después de la revisión correspondiente.\n` +
          `Si requiere una aclaración o desea iniciar una nueva solicitud, por favor responda a este correo.\n\n` +
          `Quedamos a sus órdenes.\n\n` +
          `Atentamente,\nDirección de Recursos Humanos`
      }
    };

    return map[templateId] ?? {
      subject: `Re: Solicitud de reembolso ${folio} — ${nombre}`,
      body: ''
    };
  }
}

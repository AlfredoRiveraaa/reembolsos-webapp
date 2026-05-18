export interface Reimbursement {
  id: number;
  uuid: string;
  monto: number;
  correo_solicitante: string;
  nombre_solicitante: string;
  nombre_proveedor: string;
  estatus: ReimbursementStatus;
  fecha_recepcion: string;

  forma_pago?: string;
  rfc_emisor?: string;
  fecha_factura?: string;
  mensaje?: string;
  link_expediente?: string;

  revisado_por?: number;
  fecha_resolucion?: string;
}

export type ReimbursementStatus = 'PENDIENTE' | 'EN REVISIÓN' | 'APROBADO' | 'RECHAZADO' | 'INFO_SOLICITADA';

export interface ReimbursementFilters {
  uuid: string;
  nombre_solicitante: string;
  estatus: string;
}

/**
 * Nota: Se eliminaron ReimbursementDetail y Concepto ya que
 * el backend actual no maneja desglose de conceptos por fila
 */

export interface Reimbursement {
  id: number;
  uuid: string;
  monto: number;
  correo_solicitante: string;
  nombre_solicitante: string;
  id_trabajador?: string;
  nombre_proveedor: string;
  estatus: ReimbursementStatus;
  fecha_recepcion: string;

  forma_pago?: string | number | null;
  foma_pago?: string | number | null;
  tipo_pago?: string | number | null;
  tipo_de_pago?: string | number | null;
  metodo_pago?: string | number | null;
  rfc_emisor?: string;
  fecha_factura?: string;
  mensaje?: string;
  link_expediente?: string;

  revisado_por?: number;
  fecha_ultima_revision?: string;
  ultima_revision?: string;
  fecha_ultima_apertura?: string;
  fecha_revision?: string;
  fecha_resolucion?: string;
}

export type ReimbursementStatus = 'PENDIENTE' | 'EN REVISIÓN' | 'APROBADO' | 'RECHAZADO' | 'INFO_SOLICITADA';

export const ACTIVE_REIMBURSEMENT_STATUSES: readonly ReimbursementStatus[] = [
  'PENDIENTE',
  'EN REVISIÓN',
  'INFO_SOLICITADA'
];

export const HISTORICAL_REIMBURSEMENT_STATUSES: readonly ReimbursementStatus[] = [
  'APROBADO',
  'RECHAZADO'
];

export interface ReimbursementFilters {
  nombre_solicitante: string;
  estatus: string;
  id_trabajador?: string;
}

/**
 * Nota: Se eliminaron ReimbursementDetail y Concepto ya que
 * el backend actual no maneja desglose de conceptos por fila
 */

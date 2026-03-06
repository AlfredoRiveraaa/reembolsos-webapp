export interface Reimbursement {
  id: string;
  fecha: string;
  remitente: string;
  asunto: string;
  uuid: string;
  total: number;
  estado: ReimbursementStatus;
}

export interface ReimbursementDetail extends Reimbursement {
  rfcEmisor: string;
  rfcReceptor: string;
  fechaTimbrado: string;
  descripcion: string;
  conceptos: Concepto[];
}

export interface Concepto {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export type ReimbursementStatus = 'Aprobado' | 'Pendiente' | 'En revisión' | 'Rechazado';

export interface ReimbursementFilters {
  fecha: string;
  uuid: string;
  estado: string;
}

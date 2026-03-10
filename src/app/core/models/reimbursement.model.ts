export interface Reimbursement {
  id: string;
  folioDRH: string;
  fechaRecepcion: string;
  idTrabajador: string;
  nombreTrabajador: string;
  comentario: string;
  monto: number;
  fechaRespuesta: string;
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
  folioDRH: string;
  nombreTrabajador: string;
  estado: string;
}

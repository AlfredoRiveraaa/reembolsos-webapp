import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Reimbursement, ReimbursementDetail, ReimbursementStatus } from '../models/reimbursement.model';

@Injectable({
  providedIn: 'root'
})
export class ReimbursementService {

  // Mock data simulando la API de SQL Server
  private mockReimbursements: Reimbursement[] = [
    {
      id: '1',
      folioDRH: 'DRH-2026-001',
      fechaRecepcion: '2026-03-01',
      idTrabajador: 'TRB-1001',
      nombreTrabajador: 'Juan Pérez García',
      comentario: 'Revisado el 03/03/2026',
      monto: 8500.00,
      fechaRespuesta: '2026-03-05',
      estado: 'Aprobado',
    },
    {
      id: '2',
      folioDRH: 'DRH-2026-002',
      fechaRecepcion: '2026-03-02',
      idTrabajador: 'TRB-1002',
      nombreTrabajador: 'María López Hernández',
      comentario: '',
      monto: 3200.50,
      fechaRespuesta: '',
      estado: 'Pendiente',
    },
    {
      id: '3',
      folioDRH: 'DRH-2026-003',
      fechaRecepcion: '2026-03-02',
      idTrabajador: 'TRB-1003',
      nombreTrabajador: 'Carlos Ramírez Torres',
      comentario: 'Revisado el 04/03/2026',
      monto: 12750.00,
      fechaRespuesta: '2026-03-06',
      estado: 'Aprobado',
    },
    {
      id: '4',
      folioDRH: 'DRH-2026-004',
      fechaRecepcion: '2026-03-03',
      idTrabajador: 'TRB-1004',
      nombreTrabajador: 'Ana Martínez Silva',
      comentario: 'En revisión desde 05/03/2026',
      monto: 25600.00,
      fechaRespuesta: '',
      estado: 'En revisión',
    },
    {
      id: '5',
      folioDRH: 'DRH-2026-005',
      fechaRecepcion: '2026-03-04',
      idTrabajador: 'TRB-1005',
      nombreTrabajador: 'Luis Sánchez Ortiz',
      comentario: 'Rechazado el 06/03/2026 — documentación incompleta',
      monto: 1850.75,
      fechaRespuesta: '2026-03-06',
      estado: 'Rechazado',
    },
    {
      id: '6',
      folioDRH: 'DRH-2026-006',
      fechaRecepcion: '2026-03-04',
      idTrabajador: 'TRB-1006',
      nombreTrabajador: 'Patricia Gómez Ruiz',
      comentario: 'Revisado el 05/03/2026',
      monto: 4500.00,
      fechaRespuesta: '2026-03-07',
      estado: 'Aprobado',
    },
  ];

  private mockReimbursementDetails: { [key: string]: ReimbursementDetail } = {
    '1': {
      id: '1',
      folioDRH: 'DRH-2026-001',
      fechaRecepcion: '2026-03-01',
      idTrabajador: 'TRB-1001',
      nombreTrabajador: 'Juan Pérez García',
      comentario: 'Revisado el 03/03/2026',
      monto: 8500.00,
      fechaRespuesta: '2026-03-05',
      estado: 'Aprobado',
      rfcEmisor: 'ABC123456DEF',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-01T10:30:00',
      descripcion: 'Reembolso de gastos por participación en la Conferencia Internacional de Educación Superior celebrada en Guadalajara, incluyendo transporte, hospedaje y registro.',
      conceptos: [
        { descripcion: 'Transporte aéreo redondo', cantidad: 1, precioUnitario: 3500.00 },
        { descripcion: 'Hospedaje (3 noches)', cantidad: 3, precioUnitario: 1200.00 },
        { descripcion: 'Registro conferencia', cantidad: 1, precioUnitario: 2100.00 },
      ],
    },
    '2': {
      id: '2',
      folioDRH: 'DRH-2026-002',
      fechaRecepcion: '2026-03-02',
      idTrabajador: 'TRB-1002',
      nombreTrabajador: 'María López Hernández',
      comentario: '',
      monto: 3200.50,
      fechaRespuesta: '',
      estado: 'Pendiente',
      rfcEmisor: 'XYZ789012GHI',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-02T14:20:00',
      descripcion: 'Compra de material didáctico para el curso de Matemáticas Aplicadas del semestre actual.',
      conceptos: [
        { descripcion: 'Libros de texto', cantidad: 15, precioUnitario: 180.00 },
        { descripcion: 'Material de papelería', cantidad: 1, precioUnitario: 500.50 },
      ],
    },
    '3': {
      id: '3',
      folioDRH: 'DRH-2026-003',
      fechaRecepcion: '2026-03-02',
      idTrabajador: 'TRB-1003',
      nombreTrabajador: 'Carlos Ramírez Torres',
      comentario: 'Revisado el 04/03/2026',
      monto: 12750.00,
      fechaRespuesta: '2026-03-06',
      estado: 'Aprobado',
      rfcEmisor: 'DEF456789ABC',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-02T09:15:00',
      descripcion: 'Viáticos para investigación de campo en zona rural del estado de Oaxaca.',
      conceptos: [
        { descripcion: 'Transporte terrestre', cantidad: 1, precioUnitario: 2750.00 },
        { descripcion: 'Hospedaje (5 noches)', cantidad: 5, precioUnitario: 1500.00 },
        { descripcion: 'Alimentación', cantidad: 10, precioUnitario: 250.00 },
      ],
    },
    '4': {
      id: '4',
      folioDRH: 'DRH-2026-004',
      fechaRecepcion: '2026-03-03',
      idTrabajador: 'TRB-1004',
      nombreTrabajador: 'Ana Martínez Silva',
      comentario: 'En revisión desde 05/03/2026',
      monto: 25600.00,
      fechaRespuesta: '',
      estado: 'En revisión',
      rfcEmisor: 'GHI012345JKL',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-03T11:45:00',
      descripcion: 'Adquisición de equipo especializado para el laboratorio de química analítica.',
      conceptos: [
        { descripcion: 'Microscopio digital', cantidad: 2, precioUnitario: 8500.00 },
        { descripcion: 'Kit de reactivos', cantidad: 4, precioUnitario: 1500.00 },
        { descripcion: 'Material de vidrio', cantidad: 1, precioUnitario: 2600.00 },
      ],
    },
    '5': {
      id: '5',
      folioDRH: 'DRH-2026-005',
      fechaRecepcion: '2026-03-04',
      idTrabajador: 'TRB-1005',
      nombreTrabajador: 'Luis Sánchez Ortiz',
      comentario: 'Rechazado el 06/03/2026 — documentación incompleta',
      monto: 1850.75,
      fechaRespuesta: '2026-03-06',
      estado: 'Rechazado',
      rfcEmisor: 'JKL345678MNO',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-04T08:30:00',
      descripcion: 'Gastos de transporte para asistencia a reunión de coordinadores en CDMX.',
      conceptos: [
        { descripcion: 'Boleto de autobús', cantidad: 2, precioUnitario: 650.00 },
        { descripcion: 'Taxi aeropuerto', cantidad: 2, precioUnitario: 275.375 },
      ],
    },
    '6': {
      id: '6',
      folioDRH: 'DRH-2026-006',
      fechaRecepcion: '2026-03-04',
      idTrabajador: 'TRB-1006',
      nombreTrabajador: 'Patricia Gómez Ruiz',
      comentario: 'Revisado el 05/03/2026',
      monto: 4500.00,
      fechaRespuesta: '2026-03-07',
      estado: 'Aprobado',
      rfcEmisor: 'MNO678901PQR',
      rfcReceptor: 'UNI987654321',
      fechaTimbrado: '2026-03-04T16:00:00',
      descripcion: 'Pago por publicación de artículo científico en revista indexada internacional.',
      conceptos: [
        { descripcion: 'Cuota de publicación', cantidad: 1, precioUnitario: 3500.00 },
        { descripcion: 'Traducción certificada', cantidad: 1, precioUnitario: 1000.00 },
      ],
    },
  };

  getReimbursements(): Observable<Reimbursement[]> {
    return of(this.mockReimbursements);
  }

  getReimbursementById(id: string): Observable<ReimbursementDetail | undefined> {
    return of(this.mockReimbursementDetails[id]);
  }

  updateReimbursementStatus(id: string, status: ReimbursementStatus): Observable<boolean> {
    const detail = this.mockReimbursementDetails[id];
    if (detail) {
      detail.estado = status;
      const reimbursement = this.mockReimbursements.find(r => r.id === id);
      if (reimbursement) {
        reimbursement.estado = status;
      }
      return of(true);
    }
    return of(false);
  }

  getTotalSolicitudesHoy(): number {
    return this.mockReimbursements.length;
  }

  getSolicitudesPendientes(): number {
    return this.mockReimbursements.filter(r => r.estado === 'Pendiente' || r.estado === 'En revisión').length;
  }

  getSolicitudesRechazadas(): number {
    return this.mockReimbursements.filter(r => r.estado === 'Rechazado').length;
  }

  getTotalAcumulado(): number {
    return this.mockReimbursements.reduce((sum, r) => sum + r.monto, 0);
  }
}

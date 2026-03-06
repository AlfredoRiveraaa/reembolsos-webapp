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
      fecha: '2026-03-01',
      remitente: 'Juan Pérez García',
      asunto: 'Gastos de conferencia académica',
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      total: 8500.00,
      estado: 'Aprobado',
    },
    {
      id: '2',
      fecha: '2026-03-02',
      remitente: 'María López Hernández',
      asunto: 'Material didáctico',
      uuid: 'B2C3D4E5-F6G7-8901-BCDE-F12345678901',
      total: 3200.50,
      estado: 'Pendiente',
    },
    {
      id: '3',
      fecha: '2026-03-02',
      remitente: 'Carlos Ramírez Torres',
      asunto: 'Viáticos de investigación',
      uuid: 'C3D4E5F6-G7H8-9012-CDEF-123456789012',
      total: 12750.00,
      estado: 'Aprobado',
    },
    {
      id: '4',
      fecha: '2026-03-03',
      remitente: 'Ana Martínez Silva',
      asunto: 'Equipo de laboratorio',
      uuid: 'D4E5F6G7-H8I9-0123-DEFG-234567890123',
      total: 25600.00,
      estado: 'En revisión',
    },
    {
      id: '5',
      fecha: '2026-03-04',
      remitente: 'Luis Sánchez Ortiz',
      asunto: 'Gastos de transporte',
      uuid: 'E5F6G7H8-I9J0-1234-EFGH-345678901234',
      total: 1850.75,
      estado: 'Rechazado',
    },
    {
      id: '6',
      fecha: '2026-03-04',
      remitente: 'Patricia Gómez Ruiz',
      asunto: 'Publicación académica',
      uuid: 'F6G7H8I9-J0K1-2345-FGHI-456789012345',
      total: 4500.00,
      estado: 'Aprobado',
    },
  ];

  private mockReimbursementDetails: { [key: string]: ReimbursementDetail } = {
    '1': {
      id: '1',
      fecha: '2026-03-01',
      remitente: 'Juan Pérez García',
      asunto: 'Gastos de conferencia académica',
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      total: 8500.00,
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
      fecha: '2026-03-02',
      remitente: 'María López Hernández',
      asunto: 'Material didáctico',
      uuid: 'B2C3D4E5-F6G7-8901-BCDE-F12345678901',
      total: 3200.50,
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
      fecha: '2026-03-02',
      remitente: 'Carlos Ramírez Torres',
      asunto: 'Viáticos de investigación',
      uuid: 'C3D4E5F6-G7H8-9012-CDEF-123456789012',
      total: 12750.00,
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
      fecha: '2026-03-03',
      remitente: 'Ana Martínez Silva',
      asunto: 'Equipo de laboratorio',
      uuid: 'D4E5F6G7-H8I9-0123-DEFG-234567890123',
      total: 25600.00,
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
      fecha: '2026-03-04',
      remitente: 'Luis Sánchez Ortiz',
      asunto: 'Gastos de transporte',
      uuid: 'E5F6G7H8-I9J0-1234-EFGH-345678901234',
      total: 1850.75,
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
      fecha: '2026-03-04',
      remitente: 'Patricia Gómez Ruiz',
      asunto: 'Publicación académica',
      uuid: 'F6G7H8I9-J0K1-2345-FGHI-456789012345',
      total: 4500.00,
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
    return this.mockReimbursements.reduce((sum, r) => sum + r.total, 0);
  }
}

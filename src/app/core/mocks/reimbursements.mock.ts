import { Reimbursement, ReimbursementDetail } from '../models/reimbursement.model';

export const MOCK_REIMBURSEMENTS: Reimbursement[] = [
  {
    id: '1',
    folioDRH: 'DRH-2026-001',
    fechaRecepcion: '2026-03-01',
    idTrabajador: 'TRB-1001',
    nombreTrabajador: 'Juan Perez Garcia',
    comentario: 'Revisado el 03/03/2026',
    monto: 8500.0,
    fechaRespuesta: '2026-03-05',
    estado: 'Aprobado'
  },
  {
    id: '2',
    folioDRH: 'DRH-2026-002',
    fechaRecepcion: '2026-03-02',
    idTrabajador: 'TRB-1002',
    nombreTrabajador: 'Maria Lopez Hernandez',
    comentario: '',
    monto: 3200.5,
    fechaRespuesta: '',
    estado: 'Pendiente'
  },
  {
    id: '3',
    folioDRH: 'DRH-2026-003',
    fechaRecepcion: '2026-03-02',
    idTrabajador: 'TRB-1003',
    nombreTrabajador: 'Carlos Ramirez Torres',
    comentario: 'Revisado el 04/03/2026',
    monto: 12750.0,
    fechaRespuesta: '2026-03-06',
    estado: 'Aprobado'
  },
  {
    id: '4',
    folioDRH: 'DRH-2026-004',
    fechaRecepcion: '2026-03-03',
    idTrabajador: 'TRB-1004',
    nombreTrabajador: 'Ana Martinez Silva',
    comentario: 'En revision desde 05/03/2026',
    monto: 25600.0,
    fechaRespuesta: '',
    estado: 'En revisión'
  },
  {
    id: '5',
    folioDRH: 'DRH-2026-005',
    fechaRecepcion: '2026-03-04',
    idTrabajador: 'TRB-1005',
    nombreTrabajador: 'Luis Sanchez Ortiz',
    comentario: 'Rechazado el 06/03/2026 - documentacion incompleta',
    monto: 1850.75,
    fechaRespuesta: '2026-03-06',
    estado: 'Rechazado'
  },
  {
    id: '6',
    folioDRH: 'DRH-2026-006',
    fechaRecepcion: '2026-03-04',
    idTrabajador: 'TRB-1006',
    nombreTrabajador: 'Patricia Gomez Ruiz',
    comentario: 'Revisado el 05/03/2026',
    monto: 4500.0,
    fechaRespuesta: '2026-03-07',
    estado: 'Aprobado'
  }
];

export const MOCK_REIMBURSEMENT_DETAILS: Record<string, ReimbursementDetail> = {
  '1': {
    id: '1',
    folioDRH: 'DRH-2026-001',
    fechaRecepcion: '2026-03-01',
    idTrabajador: 'TRB-1001',
    nombreTrabajador: 'Juan Perez Garcia',
    comentario: 'Revisado el 03/03/2026',
    monto: 8500.0,
    fechaRespuesta: '2026-03-05',
    estado: 'Aprobado',
    rfcEmisor: 'ABC123456DEF',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-01T10:30:00',
    descripcion: 'Reembolso de gastos por participacion en la Conferencia Internacional de Educacion Superior celebrada en Guadalajara, incluyendo transporte, hospedaje y registro.',
    conceptos: [
      { descripcion: 'Transporte aereo redondo', cantidad: 1, precioUnitario: 3500.0 },
      { descripcion: 'Hospedaje (3 noches)', cantidad: 3, precioUnitario: 1200.0 },
      { descripcion: 'Registro conferencia', cantidad: 1, precioUnitario: 2100.0 }
    ]
  },
  '2': {
    id: '2',
    folioDRH: 'DRH-2026-002',
    fechaRecepcion: '2026-03-02',
    idTrabajador: 'TRB-1002',
    nombreTrabajador: 'Maria Lopez Hernandez',
    comentario: '',
    monto: 3200.5,
    fechaRespuesta: '',
    estado: 'Pendiente',
    rfcEmisor: 'XYZ789012GHI',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-02T14:20:00',
    descripcion: 'Compra de material didactico para el curso de Matematicas Aplicadas del semestre actual.',
    conceptos: [
      { descripcion: 'Libros de texto', cantidad: 15, precioUnitario: 180.0 },
      { descripcion: 'Material de papeleria', cantidad: 1, precioUnitario: 500.5 }
    ]
  },
  '3': {
    id: '3',
    folioDRH: 'DRH-2026-003',
    fechaRecepcion: '2026-03-02',
    idTrabajador: 'TRB-1003',
    nombreTrabajador: 'Carlos Ramirez Torres',
    comentario: 'Revisado el 04/03/2026',
    monto: 12750.0,
    fechaRespuesta: '2026-03-06',
    estado: 'Aprobado',
    rfcEmisor: 'DEF456789ABC',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-02T09:15:00',
    descripcion: 'Viaticos para investigacion de campo en zona rural del estado de Oaxaca.',
    conceptos: [
      { descripcion: 'Transporte terrestre', cantidad: 1, precioUnitario: 2750.0 },
      { descripcion: 'Hospedaje (5 noches)', cantidad: 5, precioUnitario: 1500.0 },
      { descripcion: 'Alimentacion', cantidad: 10, precioUnitario: 250.0 }
    ]
  },
  '4': {
    id: '4',
    folioDRH: 'DRH-2026-004',
    fechaRecepcion: '2026-03-03',
    idTrabajador: 'TRB-1004',
    nombreTrabajador: 'Ana Martinez Silva',
    comentario: 'En revision desde 05/03/2026',
    monto: 25600.0,
    fechaRespuesta: '',
    estado: 'En revisión',
    rfcEmisor: 'GHI012345JKL',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-03T11:45:00',
    descripcion: 'Adquisicion de equipo especializado para el laboratorio de quimica analitica.',
    conceptos: [
      { descripcion: 'Microscopio digital', cantidad: 2, precioUnitario: 8500.0 },
      { descripcion: 'Kit de reactivos', cantidad: 4, precioUnitario: 1500.0 },
      { descripcion: 'Material de vidrio', cantidad: 1, precioUnitario: 2600.0 }
    ]
  },
  '5': {
    id: '5',
    folioDRH: 'DRH-2026-005',
    fechaRecepcion: '2026-03-04',
    idTrabajador: 'TRB-1005',
    nombreTrabajador: 'Luis Sanchez Ortiz',
    comentario: 'Rechazado el 06/03/2026 - documentacion incompleta',
    monto: 1850.75,
    fechaRespuesta: '2026-03-06',
    estado: 'Rechazado',
    rfcEmisor: 'JKL345678MNO',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-04T08:30:00',
    descripcion: 'Gastos de transporte para asistencia a reunion de coordinadores en CDMX.',
    conceptos: [
      { descripcion: 'Boleto de autobus', cantidad: 2, precioUnitario: 650.0 },
      { descripcion: 'Taxi aeropuerto', cantidad: 2, precioUnitario: 275.375 }
    ]
  },
  '6': {
    id: '6',
    folioDRH: 'DRH-2026-006',
    fechaRecepcion: '2026-03-04',
    idTrabajador: 'TRB-1006',
    nombreTrabajador: 'Patricia Gomez Ruiz',
    comentario: 'Revisado el 05/03/2026',
    monto: 4500.0,
    fechaRespuesta: '2026-03-07',
    estado: 'Aprobado',
    rfcEmisor: 'MNO678901PQR',
    rfcReceptor: 'UNI987654321',
    fechaTimbrado: '2026-03-04T16:00:00',
    descripcion: 'Pago por publicacion de articulo cientifico en revista indexada internacional.',
    conceptos: [
      { descripcion: 'Cuota de publicacion', cantidad: 1, precioUnitario: 3500.0 },
      { descripcion: 'Traduccion certificada', cantidad: 1, precioUnitario: 1000.0 }
    ]
  }
};

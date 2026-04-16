import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { APP_RUNTIME_CONFIG } from '../config/app-runtime.config';
import { Reimbursement, ReimbursementDetail, ReimbursementStatus } from '../models/reimbursement.model';
import { MOCK_REIMBURSEMENT_DETAILS, MOCK_REIMBURSEMENTS } from '../mocks/reimbursements.mock';

@Injectable({
  providedIn: 'root'
})
export class ReimbursementService {
  private readonly mockReimbursements: Reimbursement[] = MOCK_REIMBURSEMENTS.map(reimbursement => ({ ...reimbursement }));
  private readonly mockReimbursementDetails: Record<string, ReimbursementDetail> = Object.fromEntries(
    Object.entries(MOCK_REIMBURSEMENT_DETAILS).map(([id, detail]) => [id, {
      ...detail,
      conceptos: detail.conceptos.map(concept => ({ ...concept }))
    }])
  );

  constructor() {
    if (APP_RUNTIME_CONFIG.dataProviderMode === 'api') {
      // TODO: replace mock implementation with HttpClient API calls.
      throw new Error('API mode is not implemented yet in ReimbursementService.');
    }
  }

  getReimbursements(): Observable<Reimbursement[]> {
    return of(this.mockReimbursements.map(reimbursement => ({ ...reimbursement })));
  }

  getReimbursementById(id: string): Observable<ReimbursementDetail | undefined> {
    const detail = this.mockReimbursementDetails[id];
    if (!detail) {
      return of(undefined);
    }

    return of({
      ...detail,
      conceptos: detail.conceptos.map(concept => ({ ...concept }))
    });
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

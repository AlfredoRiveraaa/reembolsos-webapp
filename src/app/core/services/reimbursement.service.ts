import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reimbursement, ReimbursementStatus } from '../models/reimbursement.model';

@Injectable({
  providedIn: 'root'
})
export class ReimbursementService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/reembolsos';

  getReimbursements(): Observable<Reimbursement[]> {
    return this.http.get<Reimbursement[]>(this.apiUrl);
  }

  // Cambiamos el ID a number para que coincida con el backend
  getReimbursementById(id: number): Observable<Reimbursement> {
    return this.http.get<Reimbursement>(`${this.apiUrl}/${id}`);
  }

  iniciarRevision(id: number): Observable<Reimbursement> {
    return this.http.patch<Reimbursement>(`${this.apiUrl}/${id}/iniciar-revision`, {});
  }

  updateReimbursementStatus(id: number, status: ReimbursementStatus, comentarios?: string): Observable<Reimbursement> {
    // Usamos HttpParams para asegurar que los parámetros se envíen correctamente en la URL
    let params = new HttpParams().set('nuevo_estatus', status);

    if (comentarios) {
      params = params.set('comentarios_rh', comentarios);
    }

    // Enviamos null como cuerpo porque los datos van por parámetros de URL en el backend
    return this.http.put<Reimbursement>(`${this.apiUrl}/${id}/estatus`, null, { params });
  }

  // Obtiene el array de strings con los nombres de los archivos
  listarArchivos(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/archivos`);
  }

  // Descarga el archivo binario (Blob) de un archivo específico
  getDocumentBlob(id: number, nombreArchivo: string): Observable<Blob> {
    const urlSegura = `${this.apiUrl}/${id}/archivo/${encodeURIComponent(nombreArchivo)}`;
    return this.http.get(urlSegura, { responseType: 'blob' });
  }

  getStats(reimbursements: Reimbursement[]) {
    return {
      total: reimbursements.length,
      pendientes: reimbursements.filter(r => r.estatus === 'PENDIENTE' || r.estatus === 'EN REVISIÓN').length,
      rechazados: reimbursements.filter(r => r.estatus === 'RECHAZADO').length,
      acumulado: reimbursements.reduce((sum, r) => sum + Number(r.monto), 0)
    };
  }
}

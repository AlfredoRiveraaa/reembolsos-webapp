import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  montos_por_mes: number[];
  estatus: Record<string, number>;
  top_proveedores: { nombre: string; cantidad: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly apiUrl = 'http://localhost:8000/api/estadisticas/dashboard';
  private http = inject(HttpClient);

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}

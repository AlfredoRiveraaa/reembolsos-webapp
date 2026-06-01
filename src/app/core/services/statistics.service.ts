import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  montos_por_mes: number[];
  estatus: Record<string, number>;
  top_proveedores: { nombre: string; cantidad: number }[];
}

export interface DashboardStatsFilters {
  year?: number;
  from?: string;
  to?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly apiUrl = 'http://localhost:8000/api/reembolsos/estadisticas/dashboard';
  private http = inject(HttpClient);

  getDashboardStats(filters: DashboardStatsFilters = {}): Observable<DashboardStats> {
    let params = new HttpParams();

    if (filters.year) {
      params = params.set('year', filters.year);
    }

    if (filters.from) {
      params = params.set('from', filters.from);
    }

    if (filters.to) {
      params = params.set('to', filters.to);
    }

    return this.http.get<DashboardStats>(this.apiUrl, { params });
  }
}

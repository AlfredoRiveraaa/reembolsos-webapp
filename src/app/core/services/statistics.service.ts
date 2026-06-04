import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reimbursement } from '../models/reimbursement.model';

export interface DashboardStats {
  montos_por_mes: number[];
  estatus: Record<string, number>;
  top_proveedores: { nombre: string; cantidad: number }[];
}

export interface DashboardReport {
  stats: DashboardStats;
  reimbursements: Reimbursement[];
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
  private readonly reimbursementsApiUrl = 'http://localhost:8000/api/reembolsos';
  private http = inject(HttpClient);

  getDashboardStats(filters: DashboardStatsFilters = {}): Observable<DashboardStats> {
    return this.getDashboardReport(filters).pipe(
      map((report) => report.stats)
    );
  }

  getDashboardReport(filters: DashboardStatsFilters = {}): Observable<DashboardReport> {
    return this.http.get<Reimbursement[] | { reimbursements: Reimbursement[] }>(this.reimbursementsApiUrl).pipe(
      map((response) => this.buildReport(this.unwrapReimbursements(response), filters))
    );
  }

  private unwrapReimbursements(response: Reimbursement[] | { reimbursements: Reimbursement[] }): Reimbursement[] {
    return Array.isArray(response) ? response : response.reimbursements ?? [];
  }

  private buildReport(reimbursements: Reimbursement[], filters: DashboardStatsFilters): DashboardReport {
    const filteredReimbursements = reimbursements.filter((reimbursement) => this.isInsidePeriod(reimbursement, filters));
    const stats = this.buildStats(filteredReimbursements);

    return {
      stats,
      reimbursements: filteredReimbursements
    };
  }

  private buildStats(reimbursements: Reimbursement[]): DashboardStats {
    const montosPorMes = Array.from({ length: 12 }, () => 0);
    const estatus: Record<string, number> = {};
    const providerCounts = new Map<string, number>();

    for (const reimbursement of reimbursements) {
      const receptionDate = this.parseDate(reimbursement.fecha_recepcion);
      const monthIndex = receptionDate?.getMonth();

      if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < montosPorMes.length) {
        montosPorMes[monthIndex] += Number(reimbursement.monto) || 0;
      }

      const status = reimbursement.estatus || 'SIN_ESTATUS';
      estatus[status] = (estatus[status] ?? 0) + 1;

      const providerName = reimbursement.nombre_proveedor?.trim() || 'Sin proveedor';
      providerCounts.set(providerName, (providerCounts.get(providerName) ?? 0) + 1);
    }

    const topProveedores = Array.from(providerCounts.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, 'es-MX'))
      .slice(0, 5);

    return {
      montos_por_mes: montosPorMes,
      estatus,
      top_proveedores: topProveedores
    };
  }

  private isInsidePeriod(reimbursement: Reimbursement, filters: DashboardStatsFilters): boolean {
    const receptionDate = this.parseDate(reimbursement.fecha_recepcion);

    if (!receptionDate) {
      return false;
    }

    const periodStart = filters.from
      ? this.parseDate(filters.from)
      : filters.year
        ? this.parseDate(`${filters.year}-01-01`)
        : null;
    const periodEnd = filters.to
      ? this.parseDate(filters.to)
      : filters.year
        ? this.parseDate(`${filters.year}-12-31`)
        : null;

    if (periodStart && receptionDate < periodStart) {
      return false;
    }

    if (periodEnd && receptionDate > periodEnd) {
      return false;
    }

    return true;
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const datePart = value.slice(0, 10);
    const date = new Date(`${datePart}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
  }
}

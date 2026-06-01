import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  PieController,
  Tooltip,
  type ActiveElement,
  type ChartEvent
} from 'chart.js';
import * as XLSX from 'xlsx';
import { Subject, finalize, takeUntil } from 'rxjs';
import { DashboardStats, DashboardStatsFilters, StatisticsService } from '../../core/services/statistics.service';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Tooltip, Legend);

type PeriodMode = 'year' | 'custom';
type ProviderStats = DashboardStats['top_proveedores'][number];
type ExportRow = Record<string, string | number>;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly statsService = inject(StatisticsService);
  private readonly zone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();
  private readonly currentYear = new Date().getFullYear();
  private readonly monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  private readonly fallbackChartPalette = ['#1e3a5f', '#0ea5e9', '#7c3aed', '#64748b'];

  stats: DashboardStats | null = null;
  isLoading = false;
  errorMessage = '';

  periodMode: PeriodMode = 'year';
  selectedYear = this.currentYear;
  dateFrom = `${this.currentYear}-01-01`;
  dateTo = `${this.currentYear}-12-31`;
  availableYears = Array.from({ length: 6 }, (_, index) => this.currentYear - index);

  selectedMonthIndex: number | null = null;
  selectedStatus: string | null = null;
  selectedProviderName: string | null = null;

  private viewReady = false;
  private renderTimer?: ReturnType<typeof setTimeout>;
  private barChartInstance?: Chart<'bar', number[], string>;
  private pieChartInstance?: Chart<'pie', number[], string>;

  private barCanvas?: ElementRef<HTMLCanvasElement>;
  private pieCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('barCanvas')
  private set barCanvasRef(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    this.barCanvas = canvas;
    this.scheduleRenderCharts();
  }

  @ViewChild('pieCanvas')
  private set pieCanvasRef(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    this.pieCanvas = canvas;
    this.scheduleRenderCharts();
  }

  barChartData: ChartData<'bar', number[], string> = {
    labels: this.monthLabels,
    datasets: [{
      data: [],
      label: 'Monto reembolsado',
      backgroundColor: '#1e3a5f',
      borderRadius: 7,
      maxBarThickness: 42
    }]
  };

  pieChartData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: this.fallbackChartPalette,
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 8
    }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `Monto: ${this.formatCurrency(Number(context.parsed.y ?? 0))}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatCompactCurrency(Number(value))
        }
      }
    },
    onClick: (_event: ChartEvent, elements: ActiveElement[]) => this.handleBarClick(elements)
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 14,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label ?? 'Sin datos';
            const value = Number(context.parsed ?? 0);
            return `${label}: ${this.formatNumber(value)} (${this.formatPercent(this.getShare(value, this.totalRequests))})`;
          }
        }
      }
    },
    onClick: (_event: ChartEvent, elements: ActiveElement[]) => this.handlePieClick(elements)
  };

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.scheduleRenderCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearRenderTimer();
    this.destroyCharts();
  }

  loadReports(): void {
    if (!this.hasValidPeriod()) {
      this.stats = null;
      this.errorMessage = 'La fecha inicial no puede ser mayor que la fecha final.';
      this.destroyCharts();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.destroyCharts();

    this.statsService.getDashboardStats(this.currentFilters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.stats = this.normalizeStats(data);
          this.selectedMonthIndex = this.highestMonthIndex;
          this.selectedStatus = this.statusEntries[0]?.[0] ?? null;
          this.selectedProviderName = this.stats.top_proveedores[0]?.nombre ?? null;
          this.updateChartData();
          this.scheduleRenderCharts();
        },
        error: () => {
          this.stats = null;
          this.errorMessage = 'No pudimos cargar los reportes. Revisa la conexion con el backend e intenta de nuevo.';
        }
      });
  }

  refreshReports(): void {
    this.loadReports();
  }

  applyPeriodFilters(): void {
    this.loadReports();
  }

  clearPeriodFilters(): void {
    this.periodMode = 'year';
    this.selectedYear = this.currentYear;
    this.dateFrom = `${this.currentYear}-01-01`;
    this.dateTo = `${this.currentYear}-12-31`;
    this.loadReports();
  }

  selectMonth(index: number): void {
    this.selectedMonthIndex = index;
    this.updateChartData();
    this.scheduleRenderCharts();
  }

  selectStatus(status: string | null): void {
    this.selectedStatus = status;
  }

  selectProvider(provider: ProviderStats): void {
    this.selectedProviderName = provider.nombre;
  }

  exportReport(): void {
    if (!this.stats) {
      return;
    }

    const workbook = XLSX.utils.book_new();

    this.appendSheet(workbook, 'Resumen', [
      { Indicador: 'Periodo', Valor: this.activePeriodLabel },
      { Indicador: 'Solicitudes totales', Valor: this.totalRequests },
      { Indicador: 'Monto reembolsado', Valor: this.totalAnnualAmount },
      { Indicador: 'Solicitudes pendientes o en revision', Valor: this.pendingRequests },
      { Indicador: 'Solicitudes rechazadas', Valor: this.rejectedRequests },
      { Indicador: 'Solicitudes aprobadas', Valor: this.approvedRequests }
    ]);

    this.appendSheet(workbook, 'Montos_por_mes', this.monthlyRows.map((row) => ({
      Mes: row.label,
      Monto: row.amount
    })));

    this.appendSheet(workbook, 'Estatus', this.statusEntries.map(([status, count]) => ({
      Estatus: status,
      Solicitudes: count,
      Participacion: this.formatPercent(this.getShare(count, this.totalRequests))
    })));

    this.appendSheet(workbook, 'Top_proveedores', this.topProviders.map((provider, index) => ({
      Ranking: index + 1,
      Proveedor: provider.nombre,
      Solicitudes: provider.cantidad,
      Participacion_top: this.formatPercent(this.getShare(provider.cantidad, this.topProviderTotal))
    })));

    XLSX.writeFile(workbook, `reportes_reembolsos_${this.periodFileSuffix}_${this.todayFileSuffix}.xlsx`);
  }

  get activePeriodLabel(): string {
    if (this.periodMode === 'year') {
      return `Año ${this.selectedYear}`;
    }

    return `${this.formatShortDate(this.dateFrom)} - ${this.formatShortDate(this.dateTo)}`;
  }

  get totalAnnualAmount(): number {
    return this.monthlyAmounts.reduce((total, value) => total + value, 0);
  }

  get totalRequests(): number {
    return this.statusEntries.reduce((total, [, value]) => total + value, 0);
  }

  get pendingRequests(): number {
    return this.sumMatchingStatuses(['PENDIENTE', 'REVISI']);
  }

  get rejectedRequests(): number {
    return this.sumMatchingStatuses(['RECHAZADO']);
  }

  get approvedRequests(): number {
    return this.sumMatchingStatuses(['APROBADO']);
  }

  get pendingShare(): number {
    return this.getShare(this.pendingRequests, this.totalRequests);
  }

  get rejectedShare(): number {
    return this.getShare(this.rejectedRequests, this.totalRequests);
  }

  get approvedShare(): number {
    return this.getShare(this.approvedRequests, this.totalRequests);
  }

  get statusEntries(): Array<[string, number]> {
    return Object.entries(this.stats?.estatus ?? {})
      .map(([label, value]) => [label, Number(value) || 0] as [string, number])
      .sort((a, b) => b[1] - a[1]);
  }

  get topProviders(): ProviderStats[] {
    return this.stats?.top_proveedores ?? [];
  }

  get topProviderTotal(): number {
    return this.topProviders.reduce((total, provider) => total + Number(provider.cantidad || 0), 0);
  }

  get selectedProvider(): ProviderStats | null {
    return this.topProviders.find((provider) => provider.nombre === this.selectedProviderName) ?? null;
  }

  get selectedProviderShare(): number {
    return this.selectedProvider ? this.getShare(this.selectedProvider.cantidad, this.topProviderTotal) : 0;
  }

  get selectedStatusCount(): number {
    if (!this.selectedStatus) {
      return 0;
    }

    return this.statusEntries.find(([status]) => status === this.selectedStatus)?.[1] ?? 0;
  }

  get selectedStatusShare(): number {
    return this.getShare(this.selectedStatusCount, this.totalRequests);
  }

  get selectedMonthLabel(): string {
    return this.monthLabels[this.activeMonthIndex] ?? 'Sin mes';
  }

  get selectedMonthAmount(): number {
    return this.monthlyAmounts[this.activeMonthIndex] ?? 0;
  }

  get selectedMonthShare(): number {
    return this.getShare(this.selectedMonthAmount, this.totalAnnualAmount);
  }

  get monthlyRows(): Array<{ label: string; amount: number; index: number }> {
    return this.monthLabels.map((label, index) => ({
      label,
      amount: this.monthlyAmounts[index] ?? 0,
      index
    }));
  }

  get canExport(): boolean {
    return !!this.stats && !this.isLoading;
  }

  getStatusClass(status: string): string {
    const normalized = this.normalizeStatus(status);

    if (normalized.includes('APROBADO')) {
      return 'status-approved';
    }

    if (normalized.includes('RECHAZADO')) {
      return 'status-rejected';
    }

    if (normalized.includes('PENDIENTE')) {
      return 'status-pending';
    }

    if (normalized.includes('REVISI')) {
      return 'status-review';
    }

    return 'status-default';
  }

  getKpiWidth(value: number, total = this.totalRequests): string {
    const width = Math.min(this.getShare(value, total), 100);
    return `${width}%`;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatCompactCurrency(value: number): string {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      maximumFractionDigits: 1
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('es-MX');
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private get currentFilters(): DashboardStatsFilters {
    if (this.periodMode === 'year') {
      return { year: this.selectedYear };
    }

    return {
      from: this.dateFrom || undefined,
      to: this.dateTo || undefined
    };
  }

  private get monthlyAmounts(): number[] {
    return this.stats?.montos_por_mes ?? Array.from({ length: 12 }, () => 0);
  }

  private get highestMonthIndex(): number {
    return this.monthlyAmounts.reduce((highestIndex, amount, index, values) => (
      amount > values[highestIndex] ? index : highestIndex
    ), 0);
  }

  private get activeMonthIndex(): number {
    return this.selectedMonthIndex ?? this.highestMonthIndex;
  }

  private get periodFileSuffix(): string {
    if (this.periodMode === 'year') {
      return String(this.selectedYear);
    }

    return `${this.dateFrom || 'inicio'}_${this.dateTo || 'fin'}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  private get todayFileSuffix(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private hasValidPeriod(): boolean {
    return this.periodMode !== 'custom' || !this.dateFrom || !this.dateTo || this.dateFrom <= this.dateTo;
  }

  private updateChartData(): void {
    const statusEntries = this.statusEntries.filter(([, value]) => value > 0);
    const hasStatuses = statusEntries.length > 0;

    this.barChartData = {
      labels: this.monthLabels,
      datasets: [{
        data: this.monthlyAmounts,
        label: 'Monto reembolsado',
        backgroundColor: this.monthlyAmounts.map((_, index) => (
          index === this.selectedMonthIndex ? '#c9a227' : '#1e3a5f'
        )),
        borderRadius: 7,
        maxBarThickness: 42
      }]
    };

    this.pieChartData = {
      labels: hasStatuses ? statusEntries.map(([label]) => label) : ['Sin datos'],
      datasets: [{
        data: hasStatuses ? statusEntries.map(([, value]) => value) : [1],
        backgroundColor: hasStatuses
          ? statusEntries.map(([status], index) => this.getChartColorForStatus(status, index))
          : ['#e2e8f0'],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    };
  }

  private scheduleRenderCharts(): void {
    this.clearRenderTimer();

    this.renderTimer = setTimeout(() => {
      this.renderTimer = undefined;
      this.renderCharts();
    });
  }

  private renderCharts(): void {
    if (!this.viewReady || !this.stats) {
      return;
    }

    const barCtx = this.barCanvas?.nativeElement.getContext('2d');
    const pieCtx = this.pieCanvas?.nativeElement.getContext('2d');

    if (!barCtx || !pieCtx) {
      return;
    }

    this.destroyCharts();

    this.barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: this.barChartData,
      options: this.barChartOptions
    });

    this.pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: this.pieChartData,
      options: this.pieChartOptions
    });
  }

  private destroyCharts(): void {
    this.barChartInstance?.destroy();
    this.pieChartInstance?.destroy();
    this.barChartInstance = undefined;
    this.pieChartInstance = undefined;
  }

  private clearRenderTimer(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = undefined;
    }
  }

  private normalizeStats(data: DashboardStats): DashboardStats {
    return {
      montos_por_mes: Array.from({ length: 12 }, (_, index) => Number(data.montos_por_mes?.[index] ?? 0)),
      estatus: data.estatus ?? {},
      top_proveedores: data.top_proveedores ?? []
    };
  }

  private handleBarClick(elements: ActiveElement[]): void {
    const monthIndex = elements[0]?.index;

    if (monthIndex === undefined) {
      return;
    }

    this.zone.run(() => {
      this.selectedMonthIndex = monthIndex;
      this.updateChartData();
      this.scheduleRenderCharts();
    });
  }

  private handlePieClick(elements: ActiveElement[]): void {
    const statusIndex = elements[0]?.index;

    if (statusIndex === undefined) {
      return;
    }

    const label = this.pieChartData.labels?.[statusIndex];

    if (!label || label === 'Sin datos') {
      return;
    }

    this.zone.run(() => {
      this.selectedStatus = String(label);
    });
  }

  private sumMatchingStatuses(matches: string[]): number {
    return this.statusEntries.reduce((total, [status, value]) => {
      const normalized = this.normalizeStatus(status);
      return matches.some((match) => normalized.includes(match)) ? total + value : total;
    }, 0);
  }

  private normalizeStatus(status: string): string {
    return status
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ')
      .toUpperCase();
  }

  private getChartColorForStatus(status: string, index: number): string {
    const normalized = this.normalizeStatus(status);

    if (normalized.includes('APROBADO')) {
      return '#10b981';
    }

    if (normalized.includes('RECHAZADO')) {
      return '#ef4444';
    }

    if (normalized.includes('PENDIENTE')) {
      return '#f59e0b';
    }

    if (normalized.includes('REVISI')) {
      return '#3b82f6';
    }

    return this.fallbackChartPalette[index % this.fallbackChartPalette.length];
  }

  private getShare(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  private formatShortDate(dateString: string): string {
    if (!dateString) {
      return 'Sin fecha';
    }

    return new Date(`${dateString}T00:00:00`).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private appendSheet(workbook: XLSX.WorkBook, name: string, rows: ExportRow[]): void {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = this.getColumnWidths(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  }

  private getColumnWidths(rows: ExportRow[]): XLSX.ColInfo[] {
    const keys = Object.keys(rows[0] ?? {});

    return keys.map((key) => {
      const maxContentLength = rows.reduce((max, row) => {
        const cellLength = String(row[key] ?? '').length;
        return Math.max(max, cellLength);
      }, key.length);

      return { wch: Math.min(Math.max(maxContentLength + 2, 12), 42) };
    });
  }
}

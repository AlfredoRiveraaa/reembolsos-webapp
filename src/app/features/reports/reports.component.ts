import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { StatisticsService, DashboardStats } from '../../core/services/statistics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private statsService = inject(StatisticsService);
  private cdr = inject(ChangeDetectorRef);
  stats: DashboardStats | null = null;
  private viewReady = false;
  private barChartInstance?: Chart;
  private pieChartInstance?: Chart;

  @ViewChild('barCanvas') private barCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') private pieCanvas?: ElementRef<HTMLCanvasElement>;

  // Configuración Gráfica de Barras (Montos)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [ { data: [], label: 'Monto Reembolsado ($)', backgroundColor: '#003b5c' } ]
  };

  // Configuración Gráfica de Pastel (Estatus)
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [ { data: [], backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#17a2b8'] } ]
  };

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnInit(): void {
    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        console.debug('[Reports] received stats', data);
        this.stats = data;
        this.barChartData.datasets[0].data = data.montos_por_mes;
        const statusEntries = this.getStatusEntries(data.estatus);
        this.pieChartData.labels = statusEntries.map(([label]) => label);
        this.pieChartData.datasets[0].data = statusEntries.map(([, value]) => value);
        // ensure template updates before querying ViewChild elements
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.renderCharts());
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  get totalAnnualAmount(): number {
    return this.stats?.montos_por_mes.reduce((total, value) => total + value, 0) ?? 0;
  }

  get statusEntries(): Array<[string, number]> {
    return this.getStatusEntries(this.stats?.estatus ?? {});
  }

  private renderCharts(): void {
    console.debug('[Reports] renderCharts called viewReady=', this.viewReady, 'stats=', !!this.stats);
    if (!this.viewReady || !this.stats) {
      console.debug('[Reports] renderCharts aborted - waiting for view or data');
      return;
    }

    const barCanvas = this.barCanvas?.nativeElement;
    const pieCanvas = this.pieCanvas?.nativeElement;

    if (!barCanvas || !pieCanvas) {
      console.error('[Reports] canvas element(s) not found', { barCanvas, pieCanvas });
      return;
    }

    this.destroyCharts();
    try {
      // ensure there is at least minimal data to draw
      if (!this.barChartData.datasets[0].data || this.barChartData.datasets[0].data.length === 0) {
        this.barChartData.datasets[0].data = [0,0,0,0,0,0,0,0,0,0,0,0];
      }

      if (!this.pieChartData.datasets[0].data || this.pieChartData.datasets[0].data.length === 0) {
        this.pieChartData.labels = ['Sin datos'];
        this.pieChartData.datasets[0].data = [1];
      }

      console.debug('[Reports] creating charts', { barData: this.barChartData.datasets[0].data, pieData: this.pieChartData.datasets[0].data });

      const barCtx = barCanvas.getContext('2d');
      const pieCtx = pieCanvas.getContext('2d');

      if (!barCtx || !pieCtx) {
        console.error('[Reports] 2D context not available', { barCtx, pieCtx });
        return;
      }

      this.barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: this.barChartData,
        options: this.barChartOptions
      } as any);

      this.pieChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: this.pieChartData,
        options: this.pieChartOptions
      } as any);

      // force draw
      this.barChartInstance.update?.();
      this.pieChartInstance.update?.();
    } catch (err) {
      console.error('[Reports] error creating charts', err);
    }
  }

  private destroyCharts(): void {
    this.barChartInstance?.destroy();
    this.pieChartInstance?.destroy();
    this.barChartInstance = undefined;
    this.pieChartInstance = undefined;
  }

  private getStatusEntries(statusMap: Record<string, number>): Array<[string, number]> {
    return Object.entries(statusMap);
  }
}

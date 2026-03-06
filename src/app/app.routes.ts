import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './features/reimbursements/dashboard/dashboard.component';
import { ReimbursementDetailComponent } from './features/reimbursements/reimbursement-detail/reimbursement-detail.component';
import { HistorialComponent } from './features/reimbursements/historial/historial.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
        title: 'Dashboard - Reembolsos BUAP'
      },
      {
        path: 'historial',
        component: HistorialComponent,
        title: 'Historial - Reembolsos BUAP'
      },
      {
        path: 'reembolso/:id',
        component: ReimbursementDetailComponent,
        title: 'Detalle de Reembolso - BUAP'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

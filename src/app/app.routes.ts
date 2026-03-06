import { Routes } from '@angular/router';
import { DashboardComponent } from './features/reimbursements/dashboard/dashboard.component';
import { ReimbursementDetailComponent } from './features/reimbursements/reimbursement-detail/reimbursement-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard - Reembolsos'
  },
  {
    path: 'reembolso/:id',
    component: ReimbursementDetailComponent,
    title: 'Detalle de Reembolso'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

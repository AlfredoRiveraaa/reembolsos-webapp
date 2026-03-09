import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './features/reimbursements/dashboard/dashboard.component';
import { ReimbursementDetailComponent } from './features/reimbursements/reimbursement-detail/reimbursement-detail.component';
import { HistorialComponent } from './features/reimbursements/historial/historial.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Login - Reembolsos BUAP'
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
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

import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'beneficiarios', pathMatch: 'full' },

      {
        path: 'beneficiarios',
        loadChildren: () =>
          import('./features/beneficiarios/beneficiarios.routes').then(
            (m) => m.beneficiariosRoutes,
          ),
      },
      {
        path: 'familias',
        loadChildren: () =>
          import('./features/familias/familias.routes').then((m) => m.familiasRoutes),
      },
    ],
  },
];

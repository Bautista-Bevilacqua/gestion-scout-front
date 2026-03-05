import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard'; // <-- IMPORTALO ACÁ

export const beneficiariosRoutes: Routes = [
  {
    path: '', // La lista general de TODOS los scouts
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }, // <-- SOLO ADMIN
    loadComponent: () =>
      import('./pages/beneficiario-list/beneficiario-list.component').then(
        (m) => m.BeneficiarioListComponent,
      ),
  },
  {
    path: 'rama/:rama', // La lista filtrada
    canActivate: [roleGuard],
    // No le pasamos 'data', porque el Guard ya sabe leer el ':rama' y compararlo automáticamente
    loadComponent: () =>
      import('./pages/beneficiario-list/beneficiario-list.component').then(
        (m) => m.BeneficiarioListComponent,
      ),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }, // Crear beneficiarios suele ser tarea del Admin
    loadComponent: () =>
      import('./pages/beneficiario-page/beneficiario-page.component').then(
        (m) => m.BeneficiarioFormComponent,
      ),
  },
  {
    path: 'editar/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }, // Editar beneficiarios suele ser tarea del Admin
    loadComponent: () =>
      import('./pages/beneficiario-page/beneficiario-page.component').then(
        (m) => m.BeneficiarioFormComponent,
      ),
  },
];

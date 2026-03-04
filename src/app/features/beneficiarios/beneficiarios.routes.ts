import { Routes } from '@angular/router';

export const BENEFICIARIOS_ROUTES: Routes = [
  {
    path: '', // Esto equivale a /beneficiarios
    loadComponent: () =>
      import('./pages/beneficiario-list/beneficiario-list.component').then(
        (m) => m.BeneficiarioListComponent,
      ),
    title: 'Lista de Beneficiarios', // Angular cambia el título de la pestaña automáticamente!
  },
  {
    path: 'nuevo', // Ruta: /beneficiarios/nuevo
    loadComponent: () =>
      import('./pages/beneficiario-form/beneficiario-form.component').then(
        (m) => m.BeneficiarioFormComponent,
      ),
    title: 'Nuevo Beneficiario',
  },
  {
    path: 'editar/:id', // <--- NUEVA RUTA CON PARÁMETRO
    loadComponent: () =>
      import('./pages/beneficiario-form/beneficiario-form.component').then(
        (m) => m.BeneficiarioFormComponent,
      ),
    title: 'Editar Beneficiario',
  },
  // En el futuro, acá vas a agregar:
  // { path: 'nuevo', loadComponent: () => import('./pages/beneficiario-form/beneficiario-form.component').then(...) }
];

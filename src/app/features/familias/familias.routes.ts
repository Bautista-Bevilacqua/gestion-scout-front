import { Routes } from '@angular/router';

export const familiasRoutes: Routes = [
  {
    path: '', // /familias
    loadComponent: () =>
      import('./pages/familia-list-page/familia-list-page.component').then(
        (m) => m.FamiliaListComponent,
      ),
  },
  {
    path: 'nueva', // /familias/nueva
    loadComponent: () =>
      import('./pages/familia-page/familia-page.component').then((m) => m.FamiliaPageComponent),
  },
  {
    path: 'editar/:id', // /familias/editar/:id
    loadComponent: () =>
      import('./pages/familia-page/familia-page.component').then((m) => m.FamiliaPageComponent),
  },
  // --- AGREGÁ ESTA RUTA ACÁ ABAJO ---
  {
    path: ':id/cuenta', // /familias/:id/cuenta
    loadComponent: () =>
      import('./pages/cuenta-familiar-page/cuenta-familiar-page.component').then(
        (m) => m.CuentaFamiliarPageComponent,
      ),
  },
];

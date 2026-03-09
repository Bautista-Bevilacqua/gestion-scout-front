import { Routes } from '@angular/router';

export const tesoreriaRoutes: Routes = [
  {
    path: 'conceptos',
    loadComponent: () =>
      import('./conceptos/pages/conceptos-page/conceptos-page.component').then(
        (m) => m.ConceptosPageComponent,
      ),
  },
  // Si alguien entra a /tesoreria pelado, lo mandamos a conceptos por defecto
  {
    path: '',
    redirectTo: 'conceptos',
    pathMatch: 'full',
  },
];

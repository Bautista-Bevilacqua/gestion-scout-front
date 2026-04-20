import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const tesoreriaRoutes: Routes = [
  {
    path: 'conceptos',
    canActivate: [roleGuard], 
    data: { roles: ['ADMIN', 'JEFE_GRUPO'] },
    loadComponent: () =>
      import('./conceptos/pages/conceptos-page/conceptos-page.component').then(
        (m) => m.ConceptosPageComponent,
      ),
  },
  {
    path: 'caja',
    // A caja entran todos los que ya pasaron el patovica principal de app.routes.ts
    // (Admin, Jefe de Grupo y Administración)
    loadComponent: () =>
      import('./caja/pages/caja-page/caja-page.component').then((m) => m.CajaPageComponent),
  },

  // Si alguien entra a /tesoreria pelado, lo mandamos a CAJA por defecto
  // (Así evitamos que el de Administración rebote al intentar entrar a Conceptos)
  {
    path: '',
    redirectTo: 'caja',
    pathMatch: 'full',
  },
];

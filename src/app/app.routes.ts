import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'beneficiarios',
    loadChildren: () =>
      import('./features/beneficiarios/beneficiarios.routes').then((m) => m.BENEFICIARIOS_ROUTES),
  },
  {
    path: '',
    redirectTo: 'beneficiarios', // Por ahora, si entran a la raíz, los mandamos acá
    pathMatch: 'full',
  },
  {
    path: '**', // Si escriben cualquier URL que no existe
    redirectTo: 'beneficiarios', // Podríamos mandarlos a una página 404 después
  },
];

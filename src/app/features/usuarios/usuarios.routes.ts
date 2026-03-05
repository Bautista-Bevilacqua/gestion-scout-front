import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const usuariosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/usuarios-list-page.ts/usuarios-list-page.component').then(
        (m) => m.UsuarioListPageComponent,
      ),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }, // Crear beneficiarios suele ser tarea del Admin
    loadComponent: () =>
      import('./pages/add-edit-user-page/add-edit-user-page.component').then(
        (m) => m.AddEditUserPageComponent,
      ),
  },
  {
    path: 'editar/:id',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }, // Editar beneficiarios suele ser tarea del Admin
    loadComponent: () =>
      import('./pages/add-edit-user-page/add-edit-user-page.component').then(
        (m) => m.AddEditUserPageComponent,
      ),
  },
];

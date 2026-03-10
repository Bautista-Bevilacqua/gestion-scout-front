import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { HomePageComponent } from './features/home/pages/home-page.component/home-page.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/auth/pages/cambiar-password-page/cambiar-password-page.component').then(
        (m) => m.CambiarPasswordPageComponent,
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomePageComponent },
      {
        path: 'beneficiarios',
        loadChildren: () =>
          import('./features/beneficiarios/beneficiarios.routes').then(
            (m) => m.beneficiariosRoutes,
          ),
      },
      {
        path: 'familias',
        canActivate: [roleGuard], // <-- PATOVICA DE ROL
        data: { roles: ['ADMIN'] }, // <-- SOLO ADMIN
        loadChildren: () =>
          import('./features/familias/familias.routes').then((m) => m.familiasRoutes),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard], // <-- PATOVICA DE ROL
        data: { roles: ['ADMIN'] }, // <-- SOLO ADMIN
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.usuariosRoutes),
      },
      {
        path: 'tesoreria',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadChildren: () =>
          import('./features/tesoreria/tesoreria.routes').then((m) => m.tesoreriaRoutes),
      },
    ],
  },
];

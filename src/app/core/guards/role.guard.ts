import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.usuarioActual();

  // Si no hay usuario, ni nos gastamos, el authGuard ya lo va a rebotar, pero por las dudas:
  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // EL ADMIN ES DIOS: Pasa a cualquier lado sin que le pregunten nada
  if (usuario.rol === 'ADMIN') {
    return true;
  }

  // CASO 1: La ruta tiene una lista de roles permitidos quemada en la configuración
  const rolesPermitidos = route.data['roles'] as Array<string>;
  if (rolesPermitidos && rolesPermitidos.includes(usuario.rol)) {
    return true;
  }

  // CASO 2: Rutas dinámicas de Ramas (ej: /beneficiarios/rama/Manada)
  const ramaParam = route.paramMap.get('rama');
  if (ramaParam) {
    // Si el usuario es de MANADA y quiere entrar a /rama/Manada, lo dejamos
    if (usuario.rol.toUpperCase() === ramaParam.toUpperCase()) {
      return true;
    }
  }

  // SI LLEGA ACÁ: Es porque quiso entrar a una URL que no le corresponde (ej: un Unidad queriendo ver Dirigentes)
  // Lo mandamos obligado a la pantalla de su propia rama para que no ande husmeando

  // Convertimos 'UNIDAD' a 'Unidad' para que la URL quede linda
  const nombreRama = usuario.rol.charAt(0) + usuario.rol.slice(1).toLowerCase();
  router.navigate([`/beneficiarios/rama/${nombreRama}`]);

  return false;
};

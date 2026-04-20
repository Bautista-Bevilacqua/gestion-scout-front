import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuario = authService.usuarioActual();

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // 1. LOS "DIOSES" (Pase libre total)
  // Dejamos solo a Admin y Jefe de Grupo. Ellos entran a TODO sin preguntar.
  if (['ADMIN', 'JEFE_GRUPO'].includes(usuario.rol)) {
    return true;
  }

  // 2. CONTROL POR RUTA (CASO 1)
  // Acá es donde el Tesorero va a rebotar en "Conceptos" porque su rol no está en la lista.
  const rolesPermitidos = route.data['roles'] as Array<string>;
  if (rolesPermitidos && rolesPermitidos.includes(usuario.rol)) {
    return true;
  }

  // 3. CONTROL DE RAMAS (CASO 2)
  const ramaParam = route.paramMap.get('rama');
  if (ramaParam) {
    // Si es ADMINISTRACION, lo dejamos ver cualquier rama (Pase libre de consulta)
    if (usuario.rol === 'ADMINISTRACION') {
      return true;
    }

    // Dirigentes comunes: solo su rama
    if (usuario.rol.toUpperCase() === ramaParam.toUpperCase()) {
      return true;
    }
  }

  // 4. SI LLEGA ACÁ: Intruso o sin permiso
  // Si es Administración y rebotó (ej: quiso entrar a Conceptos), lo mandamos a Caja
  if (usuario.rol === 'ADMINISTRACION') {
    router.navigate(['/tesoreria/caja']);
    return false;
  }

  // Si es rama, lo mandamos a su nómina
  const nombreRama = usuario.rol.charAt(0) + usuario.rol.slice(1).toLowerCase();
  router.navigate([`/beneficiarios/rama/${nombreRama}`]);
  return false;
};

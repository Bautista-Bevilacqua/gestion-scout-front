import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Nos fijamos si hay un usuario en la señal de nuestro servicio
  const usuario = authService.usuarioActual();

  if (usuario) {
    // Si está logueado, le abrimos la puerta
    return true;
  } else {
    // Si no está logueado, lo mandamos al login y le cerramos la puerta
    router.navigate(['/login']);
    return false;
  }
};

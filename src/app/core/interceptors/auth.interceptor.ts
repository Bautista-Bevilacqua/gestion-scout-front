import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const usuario = authService.usuarioActual();

  // Si tenemos un usuario logueado y tiene token...
  if (usuario && usuario.token) {
    // Clonamos la petición original y le inyectamos la cabecera (header) de autorización
    const peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${usuario.token}`,
      },
    });

    // Mandamos la petición clonada (que ya tiene el pase VIP)
    return next(peticionClonada);
  }

  // Si no hay token (ej: está en la pantalla de login), mandamos la petición normal
  return next(req);
};

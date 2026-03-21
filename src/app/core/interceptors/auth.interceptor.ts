import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const usuario = authService.usuarioActual();

  if (usuario && usuario.token) {
    const peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${usuario.token}`,
      },
    });

    return next(peticionClonada);
  }

  return next(req);
};

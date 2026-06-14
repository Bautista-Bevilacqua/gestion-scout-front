import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const usuario = authService.usuarioActual();

  // 1. Verificamos que la petición vaya a NUESTRA API y no a otra página
  const vaHaciaNuestraApi = req.url.startsWith(environment.apiUrl);

  if (usuario && usuario.token && vaHaciaNuestraApi) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${usuario.token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};

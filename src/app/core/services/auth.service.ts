import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RolUsuario = 'ADMIN' | 'MANADA' | 'UNIDAD' | 'CAMINANTES' | 'ROVERS' | 'JEFE_GRUPO' | 'ADMINISTRACION';
export interface UsuarioLogueado {
  id: number;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
  token?: string;
  debe_cambiar_password?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  public usuarioActual = signal<UsuarioLogueado | null>(null);

  constructor() {
    this.cargarSesionGuardada();
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        const usuarioConToken: UsuarioLogueado = { ...res.usuario, token: res.token };
        this.usuarioActual.set(usuarioConToken);
        localStorage.setItem('scout_session', JSON.stringify(usuarioConToken));
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout() {
    this.usuarioActual.set(null);
    localStorage.removeItem('scout_session');
    this.router.navigate(['/login']);
  }

  private cargarSesionGuardada() {
    const sesion = localStorage.getItem('scout_session');
    if (sesion) {
      this.usuarioActual.set(JSON.parse(sesion));
    }
  }

  cambiarPassword(nuevaPassword: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/cambiar-password`, { nuevaPassword }).pipe(
      tap(() => {
        const user = this.usuarioActual();
        if (user) {
          const userActualizado = { ...user, debe_cambiar_password: false };
          this.usuarioActual.set(userActualizado);
          localStorage.setItem('scout_session', JSON.stringify(userActualizado));
        }
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }
}

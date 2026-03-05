import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

export type RolUsuario = 'ADMIN' | 'MANADA' | 'UNIDAD' | 'CAMINANTES' | 'ROVERS';

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
  private apiUrl = 'http://localhost:3000/api/auth';

  public usuarioActual = signal<UsuarioLogueado | null>(null);

  constructor() {
    this.cargarSesionGuardada();
  }

  // Ahora devuelve un Observable porque es una petición asíncrona
  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        // Armamos el objeto combinando los datos del usuario y el token que mandó Node
        const usuarioConToken: UsuarioLogueado = { ...res.usuario, token: res.token };
        this.usuarioActual.set(usuarioConToken);
        localStorage.setItem('scout_session', JSON.stringify(usuarioConToken));
      }),
      map(() => true), // Si salió bien, devolvemos true
      catchError(() => of(false)), // Si el backend tiró error (ej: 401), devolvemos false
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
        // Si salió bien, actualizamos la señal para sacarle la marca y lo guardamos en el localStorage
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

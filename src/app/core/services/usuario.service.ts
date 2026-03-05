import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Usuario } from '../../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/usuarios';

  public cacheUsuarios = signal<Usuario[] | null>(null);

  getUsuarios(): Observable<Usuario[]> {
    return this.http
      .get<Usuario[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheUsuarios.set(datos)));
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  // ACTUALIZAR
  actualizarUsuario(id: number, data: any): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => {
        // Limpiamos la caché para que la tabla se refresque con los datos nuevos
        this.cacheUsuarios.set(null);
      }),
    );
  }

  crearUsuario(data: any): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, data).pipe(
      tap(() => {
        this.cacheUsuarios.set(null);
      }),
    );
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheUsuarios.set(null);
      }),
    );
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Usuario } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  private cacheUsuarios = signal<Usuario[] | null>(null);

  getUsuarios(forzarRecarga: boolean = false): Observable<Usuario[]> {
    const cacheActual = this.cacheUsuarios();

    if (cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }

    return this.http
      .get<Usuario[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheUsuarios.set(datos)));
  }

  limpiarCache() {
    this.cacheUsuarios.set(null);
  }

  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  actualizarUsuario(id: number, data: any): Observable<Usuario> {
    return this.http
      .put<Usuario>(`${this.apiUrl}/${id}`, data)
      .pipe(tap(() => this.limpiarCache()));
  }

  crearUsuario(data: any): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, data).pipe(tap(() => this.limpiarCache()));
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => this.limpiarCache()));
  }
}

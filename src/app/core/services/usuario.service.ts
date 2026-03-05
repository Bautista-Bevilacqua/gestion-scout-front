import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs'; // <-- ¡Asegurate de importar 'of'!
import { Usuario } from '../../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/usuarios';

  // Lo pasamos a privado para mantener la misma estructura
  private cacheUsuarios = signal<Usuario[] | null>(null);

  getUsuarios(forzarRecarga: boolean = false): Observable<Usuario[]> {
    const cacheActual = this.cacheUsuarios();

    // EL CANDADO: Si ya tenemos datos y no nos piden forzar, devolvemos la caché
    if (cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }

    // Si no hay caché o forzaron la recarga, vamos al Backend
    return this.http
      .get<Usuario[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheUsuarios.set(datos)));
  }

  // Método centralizado para limpiar
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

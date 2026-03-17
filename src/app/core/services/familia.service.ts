import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Familia } from '../../models/familia.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FamiliaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/familias`;

  private cacheFamilias = signal<Familia[] | null>(null);

  getFamilias(termino?: string, forzarRecarga: boolean = false): Observable<Familia[]> {
    if (termino && termino.length >= 2) {
      return this.http.get<Familia[]>(`${this.apiUrl}?q=${termino}`);
    }

    const cacheActual = this.cacheFamilias();
    if (cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }

    return this.http
      .get<Familia[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheFamilias.set(datos)));
  }

  limpiarCache() {
    this.cacheFamilias.set(null);
  }

  getFamiliaById(id: number): Observable<Familia> {
    return this.http.get<Familia>(`${this.apiUrl}/${id}`);
  }

  createFamilia(familia: Familia): Observable<Familia> {
    return this.http.post<Familia>(this.apiUrl, familia).pipe(tap(() => this.limpiarCache()));
  }

  updateFamilia(id: number, familia: Partial<Familia>): Observable<Familia> {
    return this.http
      .put<Familia>(`${this.apiUrl}/${id}`, familia)
      .pipe(tap(() => this.limpiarCache()));
  }

  deleteFamilia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => this.limpiarCache()));
  }
}

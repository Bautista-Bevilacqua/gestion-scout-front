import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { MovimientoCaja } from '../../models/caja.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private apiUrl = `${environment.apiUrl}/caja`;
  private http = inject(HttpClient);

  private cacheMovimientos = signal<MovimientoCaja[] | null>(null);

  getMovimientos(
    fechaDesde?: string,
    fechaHasta?: string,
    forzarRecarga: boolean = false,
  ): Observable<MovimientoCaja[]> {
    const cacheActual = this.cacheMovimientos();

    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    if (!fechaDesde && !fechaHasta && cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }

    return this.http.get<MovimientoCaja[]>(this.apiUrl, { params }).pipe(
      tap((datos) => {
        if (!fechaDesde && !fechaHasta) {
          this.cacheMovimientos.set(datos);
        }
      }),
    );
  }

  limpiarCache() {
    this.cacheMovimientos.set(null);
  }

  crearMovimientoManual(datos: {
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    concepto: string;
    comprobante?: string;
    persona_involucrada?: string;
  }): Observable<MovimientoCaja> {
    return this.http
      .post<MovimientoCaja>(`${this.apiUrl}/manual`, datos)
      .pipe(tap(() => this.limpiarCache()));
  }
}

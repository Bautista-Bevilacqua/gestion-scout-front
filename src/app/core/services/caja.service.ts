import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovimientoCaja } from '../../models/caja.model';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private apiUrl = 'http://localhost:3000/api/caja';

  private http = inject(HttpClient);

  getMovimientos(fechaDesde?: string, fechaHasta?: string): Observable<MovimientoCaja[]> {
    let params = new HttpParams();

    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);

    return this.http.get<MovimientoCaja[]>(this.apiUrl, { params });
  }

  crearMovimientoManual(datos: {
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    concepto: string;
    comprobante?: string;
    persona_involucrada?: string;
  }): Observable<MovimientoCaja> {
    return this.http.post<MovimientoCaja>(`${this.apiUrl}/manual`, datos);
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { ConceptoCobro } from '../../models/concepto-cobro.model';

@Injectable({
  providedIn: 'root',
})
export class ConceptoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/conceptos';

  private cacheConceptos = signal<ConceptoCobro[] | null>(null);

  getConceptos(forzarRecarga: boolean = false): Observable<ConceptoCobro[]> {
    const cacheActual = this.cacheConceptos();
    if (cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }
    return this.http
      .get<ConceptoCobro[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheConceptos.set(datos)));
  }

  limpiarCache() {
    this.cacheConceptos.set(null);
  }

  crearConcepto(concepto: Partial<ConceptoCobro>): Observable<ConceptoCobro> {
    return this.http
      .post<ConceptoCobro>(this.apiUrl, concepto)
      .pipe(tap(() => this.limpiarCache()));
  }

  eliminarConcepto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => this.limpiarCache()));
  }

  asignarConcepto(idConcepto: number): Observable<{ mensaje: string; cantidad: number }> {
    return this.http.post<any>(`${this.apiUrl}/${idConcepto}/asignar`, {});
  }

  getConceptosDisponibles(idBeneficiario: number): Observable<ConceptoCobro[]> {
    return this.http.get<ConceptoCobro[]>(`${this.apiUrl}/disponibles/${idBeneficiario}`);
  }

  crearCuotasMasivas(data: any): Observable<ConceptoCobro[]> {
    return this.http
      .post<ConceptoCobro[]>(`${this.apiUrl}/masivo`, data)
      .pipe(tap(() => this.limpiarCache()));
  }
}

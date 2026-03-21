import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Beneficiario } from '../../models/beneficiario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BeneficiarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/beneficiarios`;

  private cacheBeneficiarios = signal<Beneficiario[] | null>(null);

  getBeneficiarios(forzarRecarga: boolean = false): Observable<Beneficiario[]> {
    const cacheActual = this.cacheBeneficiarios();

    if (cacheActual && !forzarRecarga) {
      return of(cacheActual);
    }

    return this.http
      .get<Beneficiario[]>(this.apiUrl)
      .pipe(tap((datos) => this.cacheBeneficiarios.set(datos)));
  }

  limpiarCache() {
    this.cacheBeneficiarios.set(null);
  }

  createBeneficiario(beneficiario: Beneficiario): Observable<Beneficiario> {
    return this.http
      .post<Beneficiario>(this.apiUrl, beneficiario)
      .pipe(tap(() => this.limpiarCache()));
  }

  getBeneficiarioById(id: number): Observable<Beneficiario> {
    return this.http.get<Beneficiario>(`${this.apiUrl}/${id}`);
  }

  updateBeneficiario(id: number, beneficiario: Partial<Beneficiario>): Observable<Beneficiario> {
    return this.http
      .put<Beneficiario>(`${this.apiUrl}/${id}`, beneficiario)
      .pipe(tap(() => this.limpiarCache()));
  }

  deleteBeneficiario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => this.limpiarCache()));
  }

  getPorFamilia(idFamilia: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/familia/${idFamilia}`);
  }

  getHistorial(idBeneficiario: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idBeneficiario}/historial`);
  }

  agregarAlHistorial(idBeneficiario: number, descripcion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idBeneficiario}/historial`, { descripcion });
  }
}

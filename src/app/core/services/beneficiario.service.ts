import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Beneficiario } from '../../models/beneficiario.model';

@Injectable({
  providedIn: 'root',
})
export class BeneficiarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/beneficiarios';

  getBeneficiarios(): Observable<Beneficiario[]> {
    return this.http.get<Beneficiario[]>(this.apiUrl);
  }

  createBeneficiario(beneficiario: Beneficiario): Observable<Beneficiario> {
    return this.http.post<Beneficiario>(this.apiUrl, beneficiario);
  }

  getBeneficiarioById(id: number): Observable<Beneficiario> {
    return this.http.get<Beneficiario>(`${this.apiUrl}/${id}`);
  }

  updateBeneficiario(id: number, beneficiario: Partial<Beneficiario>): Observable<Beneficiario> {
    return this.http.put<Beneficiario>(`${this.apiUrl}/${id}`, beneficiario);
  }

  deleteBeneficiario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

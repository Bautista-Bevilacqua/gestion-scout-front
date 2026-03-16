import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoLegajo } from '../../models/legajo.model';

@Injectable({
  providedIn: 'root',
})
export class LegajoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/legajos';

  getDocumentos(idBeneficiario: number): Observable<DocumentoLegajo[]> {
    return this.http.get<DocumentoLegajo[]>(`${this.apiUrl}/${idBeneficiario}`);
  }

  subirDocumento(idBeneficiario: number, archivo: File): Observable<DocumentoLegajo> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<DocumentoLegajo>(`${this.apiUrl}/${idBeneficiario}`, formData);
  }

  eliminarDocumento(idDocumento: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idDocumento}`);
  }
}

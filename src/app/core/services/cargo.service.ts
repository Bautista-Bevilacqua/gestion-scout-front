import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo } from '../../models/cargo.model';

@Injectable({
  providedIn: 'root',
})
export class CargoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/cargos';

  // Trae el historial completo de un chico
  getCargosPorBeneficiario(idBeneficiario: number): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.apiUrl}/beneficiario/${idBeneficiario}`);
  }

  // Registra el cobro en el backend
  pagarCargo(idCargo: number, metodoPago: string = 'EFECTIVO'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idCargo}/pagar`, { metodoPago });
  }

  asignarIndividual(idBeneficiario: number, idConcepto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/individual`, { idBeneficiario, idConcepto });
  }

  pagarMultiplesCargos(ids: number[], metodoPago: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pagar-multiples`, { ids, metodoPago });
  }
}

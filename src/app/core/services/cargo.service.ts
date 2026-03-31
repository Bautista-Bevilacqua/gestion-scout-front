import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo } from '../../models/cargo.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CargoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cargos`;

  getCargosPorBeneficiario(idBeneficiario: number): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(`${this.apiUrl}/beneficiario/${idBeneficiario}`);
  }

  registrarPago(
    idCargo: number,
    metodoPago: string = 'EFECTIVO',
    montoAbonado?: number,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idCargo}/pagar`, { metodoPago, montoAbonado });
  }

  asignarIndividual(idBeneficiario: number, idConcepto: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/individual`, { idBeneficiario, idConcepto });
  }

  pagarMultiplesCargos(ids: number[], metodoPago: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pagar-multiples`, { ids, metodoPago });
  }

  eliminarCargo(idCargo: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idCargo}`);
  }
}

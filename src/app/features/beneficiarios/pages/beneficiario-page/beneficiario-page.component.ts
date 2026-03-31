import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { Beneficiario } from '../../../../models/beneficiario.model';
import { Familia } from '../../../../models/familia.model';
import { FamiliaService } from '../../../../core/services/familia.service';
import { AlertErrorComponent } from '../../../../shared/components/alert-error/alert-error.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner.component/loading-spinner.component';
import { FormularioBeneficiarioComponent } from '../../components/beneficiario-form.component/beneficiario-form.component';

@Component({
  selector: 'app-beneficiario-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AlertErrorComponent,
    LoadingSpinnerComponent,
    FormularioBeneficiarioComponent,
  ],
  templateUrl: './beneficiario-page.component.html',
})
export class BeneficiarioFormComponent implements OnInit {
  private beneficiarioService = inject(BeneficiarioService);
  private familiaService = inject(FamiliaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public beneficiarioId: number | null = null;
  public cargando = signal<boolean>(false);
  public errorMsg = signal<string | null>(null);

  public scoutPrecargado = signal<Beneficiario | null>(null);
  public familiaPrecargada = signal<Familia | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.beneficiarioId = Number(idParam);
      this.cargando.set(true);
      this.cargarDatos(this.beneficiarioId);
    }
  }

  cargarDatos(id: number) {
    this.beneficiarioService.getBeneficiarioById(id).subscribe({
      next: (data) => {
        const fechaFormateada = new Date(data.fecha_nacimiento).toISOString().split('T')[0];
        const scoutListo = { ...data, fecha_nacimiento: fechaFormateada };
        this.scoutPrecargado.set(scoutListo);

        if (data.id_familia) {
          this.familiaService.getFamiliaById(data.id_familia).subscribe((f) => {
            this.familiaPrecargada.set(f);
          });
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  procesarGuardado(datos: Beneficiario) {
    this.cargando.set(true);
    this.errorMsg.set(null);

    const request = this.beneficiarioId
      ? this.beneficiarioService.updateBeneficiario(this.beneficiarioId, datos)
      : this.beneficiarioService.createBeneficiario(datos);

    request.subscribe({
      next: () => this.router.navigate(['/beneficiarios']),
      error: (err) => {
        this.cargando.set(false);
        this.errorMsg.set(err.error?.message || 'Error al procesar la solicitud.');
      },
    });
  }
}

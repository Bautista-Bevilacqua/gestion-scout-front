import { Component, inject, OnInit, signal } from '@angular/core';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { Beneficiario } from '../../../../models/beneficiario.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-beneficiario-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './beneficiario-list.component.html',
})
export class BeneficiarioListComponent implements OnInit {
  private beneficiarioService = inject(BeneficiarioService);

  public beneficiarios = signal<Beneficiario[]>([]);
  public beneficiarioSeleccionado = signal<any>(null);
  public cargando = signal<boolean>(true);
  public error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarBeneficiarios();
  }

  cargarBeneficiarios() {
    this.cargando.set(true);
    this.error.set(null);

    this.beneficiarioService.getBeneficiarios().subscribe({
      next: (data) => {
        this.beneficiarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error crítico:', err);
        this.error.set(
          'No pudimos conectar con el servidor. Revisá tu conexión o intentá más tarde.',
        );
        this.cargando.set(false);
      },
    });
  }

  prepararBorrado(beneficiario: any) {
    this.beneficiarioSeleccionado.set(beneficiario);
    const modal = document.getElementById('modal_confirmar_borrado') as HTMLDialogElement;
    modal?.showModal();
  }

  confirmarBorrado() {
    const b = this.beneficiarioSeleccionado();
    if (b) {
      this.beneficiarioService.deleteBeneficiario(b.id_beneficiario).subscribe({
        next: () => {
          this.cargarBeneficiarios();
          this.beneficiarioSeleccionado.set(null);
        },
      });
    }
  }
}

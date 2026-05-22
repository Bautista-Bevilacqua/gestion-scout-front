import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConceptoService } from '../../../../../core/services/concepto.service';

@Component({
  selector: 'app-generar-cuotas-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generar-cuotas-modal.component.html',
})
export class GenerarCuotasModalComponent {
  private fb = inject(FormBuilder);
  private conceptoService = inject(ConceptoService);

  onFinalizado = output<void>();

  public guardando = signal(false);
  public errorMsg = signal<string | null>(null); // Nueva señal para el error

  public listaMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  public cuotasForm = this.fb.group({
    meses: [[] as string[], [Validators.required, Validators.minLength(1)]],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2024)]],
    monto_efectivo: ['', [Validators.required, Validators.min(0)]],
    monto_transferencia: ['', [Validators.required, Validators.min(0)]],
    alcance: ['GRUPO', Validators.required],
    fecha_vencimiento: ['', Validators.required],
  });

  abrir() {
    this.errorMsg.set(null); // Limpiamos errores previos al abrir
    this.cuotasForm.reset({ anio: new Date().getFullYear(), alcance: 'GRUPO', meses: [] });

    // Desmarcamos visualmente los checkboxes si quedó alguno marcado
    document
      .querySelectorAll('#modal_generar_cuotas input[type="checkbox"]')
      .forEach((cb: any) => (cb.checked = false));

    (document.getElementById('modal_generar_cuotas') as HTMLDialogElement)?.showModal();
  }

  cerrar() {
    this.errorMsg.set(null); // Limpiamos errores al cerrar
    (document.getElementById('modal_generar_cuotas') as HTMLDialogElement)?.close();
  }

  onMesChange(mes: string, event: any) {
    const seleccionados = this.cuotasForm.value.meses || [];
    if (event.target.checked) {
      this.cuotasForm.patchValue({ meses: [...seleccionados, mes] });
    } else {
      this.cuotasForm.patchValue({ meses: seleccionados.filter((m) => m !== mes) });
    }
  }

  guardar() {
    if (this.cuotasForm.invalid) return;

    this.errorMsg.set(null); // Limpiamos el error antes de intentar guardar
    this.guardando.set(true);

    this.conceptoService.crearCuotasMasivas(this.cuotasForm.value).subscribe({
      next: () => {
        this.guardando.set(false);
        this.onFinalizado.emit();
        this.cerrar();
      },
      error: (err) => {
        this.guardando.set(false);

        // Atrapamos el mensaje del backend o mostramos uno genérico
        if (err.error && err.error.message) {
          this.errorMsg.set(err.error.message);
        } else {
          this.errorMsg.set('Hubo un error al generar las cuotas.');
        }
      },
    });
  }
}

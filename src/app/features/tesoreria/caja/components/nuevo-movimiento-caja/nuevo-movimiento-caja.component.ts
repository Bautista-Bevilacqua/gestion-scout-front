import { Component, ElementRef, ViewChild, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../../../../core/services/caja.service';

@Component({
  selector: 'app-nuevo-movimiento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-movimiento-caja.component.html',
})
export class NuevoMovimientoModalComponent {
  private cajaService = inject(CajaService);

  @ViewChild('modalDialog') dialog!: ElementRef<HTMLDialogElement>;

  onGuardado = output<void>();

  public guardando = signal(false);
  public nuevoMovimiento = signal({
    tipo: 'EGRESO' as 'INGRESO' | 'EGRESO',
    monto: null as number | null,
    concepto: '',
    comprobante: '',
    persona_involucrada: '',
  });

  actualizarCampo(campo: string, valor: any) {
    this.nuevoMovimiento.update((actual) => ({ ...actual, [campo]: valor }));
  }

  abrir() {
    this.nuevoMovimiento.set({
      tipo: 'EGRESO',
      monto: null,
      concepto: '',
      comprobante: '',
      persona_involucrada: '',
    });
    this.dialog.nativeElement.showModal();
  }

  cerrar() {
    this.dialog.nativeElement.close();
  }

  guardar() {
    const mov = this.nuevoMovimiento();
    if (!mov.monto || mov.monto <= 0 || !mov.concepto.trim()) return;

    this.guardando.set(true);

    this.cajaService
      .crearMovimientoManual({
        tipo: mov.tipo,
        monto: Number(mov.monto),
        concepto: mov.concepto,
        comprobante: mov.comprobante,
        persona_involucrada: mov.persona_involucrada,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrar();
          this.onGuardado.emit();
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.guardando.set(false);
          alert('Hubo un error al registrar el movimiento.');
        },
      });
  }
}

import { Component, input, output, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirmar-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-pago-modal.component.html',
})
export class ConfirmarPagoModalComponent {
  cargo = input<any | null>(null);
  procesando = input<boolean>(false);
  saldoAFavor = input<number>(0); // NUEVO INPUT

  onConfirmar = output<{ metodo: string; monto?: number }>();
  onCerrar = output<void>();

  montoAbonado = signal<number | null>(null);
  esPagoParcial = signal<boolean>(false);

  // Computadas para limpiar el HTML
  costoEfectivo = computed(
    () =>
      this.montoAbonado() ||
      (this.cargo()?.es_multiple ? this.cargo()?.monto_efectivo : this.cargo()?.deuda_efectivo) ||
      0,
  );
  costoMP = computed(
    () =>
      this.montoAbonado() ||
      (this.cargo()?.es_multiple
        ? this.cargo()?.monto_transferencia
        : this.cargo()?.deuda_transferencia) ||
      0,
  );

  constructor() {
    effect(() => {
      const c = this.cargo();
      this.esPagoParcial.set(false);
      if (c && !c.es_multiple) {
        this.montoAbonado.set(c.deuda_efectivo || c.monto_efectivo);
      } else {
        this.montoAbonado.set(null);
      }
    });
  }

  confirmar(metodo: string) {
    const montoFinal =
      !this.cargo()?.es_multiple && this.esPagoParcial()
        ? this.montoAbonado() || undefined
        : undefined;
    this.onConfirmar.emit({ metodo: metodo, monto: montoFinal });
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

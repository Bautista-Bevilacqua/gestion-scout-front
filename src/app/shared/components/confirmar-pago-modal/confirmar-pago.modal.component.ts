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
  saldoAFavor = input<number>(0);

  onConfirmar = output<{ metodo: string; monto?: number; usarSaldo: boolean }>();
  onCerrar = output<void>();

  montoAbonado = signal<number | null>(null);
  esPagoParcial = signal<boolean>(false);
  usarSaldo = signal<boolean>(false);

  // Cálculos base
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

  // Cuánto de la billetera se va a gastar según el método
  cubiertoConSaldoEfectivo = computed(() =>
    this.usarSaldo() ? Math.min(this.saldoAFavor(), this.costoEfectivo()) : 0,
  );
  cubiertoConSaldoMP = computed(() =>
    this.usarSaldo() ? Math.min(this.saldoAFavor(), this.costoMP()) : 0,
  );

  // Cuánto falta cobrar por caja física
  restanteEfectivo = computed(() => this.costoEfectivo() - this.cubiertoConSaldoEfectivo());
  restanteMP = computed(() => this.costoMP() - this.cubiertoConSaldoMP());

  constructor() {
    effect(() => {
      const c = this.cargo();
      this.esPagoParcial.set(false);
      this.usarSaldo.set(false);

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
    this.onConfirmar.emit({
      metodo: metodo,
      monto: montoFinal,
      usarSaldo: this.usarSaldo(),
    });
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

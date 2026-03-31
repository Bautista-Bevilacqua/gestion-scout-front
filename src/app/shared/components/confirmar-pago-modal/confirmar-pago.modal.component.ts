import { Component, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cargo } from '../../../models/cargo.model';

@Component({
  selector: 'app-confirmar-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-pago-modal.component.html',
})
export class ConfirmarPagoModalComponent {
  cargo = input<any | null>(null);
  procesando = input<boolean>(false);

  onConfirmar = output<{ metodo: string; monto?: number }>();
  onCerrar = output<void>();

  montoAbonado = signal<number | null>(null);
  esPagoParcial = signal<boolean>(false); // <-- NUEVO ESTADO

  constructor() {
    effect(
      () => {
        const c = this.cargo();
        this.esPagoParcial.set(false); // Apagamos el switch por defecto al abrir

        if (c && !c.es_multiple) {
          this.montoAbonado.set(c.deuda_efectivo || c.monto_efectivo);
        } else {
          this.montoAbonado.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  confirmar(metodo: string) {
    // Solo mandamos el monto personalizado si es un cobro individual Y prendió el switch parcial
    const montoFinal =
      !this.cargo()?.es_multiple && this.esPagoParcial()
        ? this.montoAbonado() || undefined
        : undefined;

    this.onConfirmar.emit({
      metodo: metodo,
      monto: montoFinal,
    });
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

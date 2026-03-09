import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cargo } from '../../../models/cargo.model';

@Component({
  selector: 'app-confirmar-pago-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-pago-modal.component.html',
})
export class ConfirmarPagoModalComponent {
  // Recibimos el cargo a cobrar y si el sistema está "pensando"
  cargo = input<Partial<Cargo> | null>(null);
  procesando = input<boolean>(false);

  // Avisamos a la página qué decidió el usuario
  onConfirmar = output<'EFECTIVO' | 'MERCADOPAGO'>();
  onCerrar = output<void>();

  confirmar(metodo: 'EFECTIVO' | 'MERCADOPAGO') {
    this.onConfirmar.emit(metodo);
  }

  cerrar() {
    this.onCerrar.emit();
  }
}

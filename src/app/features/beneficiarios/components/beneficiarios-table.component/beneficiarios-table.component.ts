import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Beneficiario } from '../../../../models/beneficiario.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-tabla-beneficiarios',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './beneficiarios-table.component.html',
})
export class BeneficiariosTableComponent {
  private authService = inject(AuthService);
  // Recibe la lista desde la página
  beneficiarios = input<Beneficiario[]>([]);

  // Emite un evento cuando tocan "Eliminar" pasándole el scout
  @Output() onEliminar = new EventEmitter<Beneficiario>();
  @Output() onAbrirCajero = new EventEmitter<Beneficiario>();

  public sortField = signal<keyof Beneficiario>('apellido');
  public sortDirection = signal<'asc' | 'desc'>('asc');

  public beneficiariosOrdenados = computed(() => {
    const listaOriginal = this.beneficiarios();
    const field = this.sortField();
    const direction = this.sortDirection();

    return [...listaOriginal].sort((a, b) => {
      // 2. Ahora TypeScript sabe que a[field] es válido porque field es keyof Beneficiario
      let valA = a[field];
      let valB = b[field];

      // Convertimos a string para comparar sin importar mayúsculas
      const strA = (valA ?? '').toString().toLowerCase();
      const strB = (valB ?? '').toString().toLowerCase();

      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  public isAdmin = computed(() => this.authService.usuarioActual()?.rol === 'ADMIN');

  cambiarOrden(field: keyof Beneficiario) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  abrirCajero(b: Beneficiario) {
    this.onAbrirCajero.emit(b);
  }

  eliminar(b: Beneficiario) {
    this.onEliminar.emit(b);
  }
}

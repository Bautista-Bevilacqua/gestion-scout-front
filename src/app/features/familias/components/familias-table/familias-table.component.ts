import { Component, EventEmitter, Output, inject, computed, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Familia } from '../../../../models/familia.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-tabla-familias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './familias-table.component.html',
})
export class TablaFamiliasComponent {
  private authService = inject(AuthService);

  // 1. Input como señal
  familias = input<Familia[]>([]);
  @Output() onEliminar = new EventEmitter<Familia>();

  // 2. Permisos y Ordenamiento
  public isAdmin = computed(() => {
    const rol = this.authService.usuarioActual()?.rol;
    return rol === 'ADMIN' || rol === 'JEFE_GRUPO';
  });

  public isGerencia = computed(() => {
    const rol = this.authService.usuarioActual()?.rol;
    return rol === 'ADMIN' || rol === 'JEFE_GRUPO' || rol === 'ADMINISTRACION';
  });

  
  public sortField = signal<keyof Familia>('apellido_familia');
  public sortDirection = signal<'asc' | 'desc'>('asc');

  // 3. Señal computada para devolver los datos ordenados
  public familiasOrdenadas = computed(() => {
    const lista = this.familias();
    const field = this.sortField();
    const direction = this.sortDirection();

    return [...lista].sort((a, b) => {
      const valA = (a[field] || '').toString().toLowerCase();
      const valB = (b[field] || '').toString().toLowerCase();

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  cambiarOrden(field: keyof Familia) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  eliminar(f: Familia) {
    this.onEliminar.emit(f);
  }
}

import { Component, EventEmitter, Output, computed, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../../models/usuario.model';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  // 1. Convertimos los @Input en signals
  usuarios = input.required<Usuario[]>();
  esAdmin = input<boolean>(false);

  @Output() onEliminar = new EventEmitter<Usuario>();

  // 2. Lógica de ordenamiento
  public sortField = signal<keyof Usuario>('apellido');
  public sortDirection = signal<'asc' | 'desc'>('asc');

  // 3. Computed para devolver la lista ordenada
  public usuariosOrdenados = computed(() => {
    const lista = this.usuarios();
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

  cambiarOrden(field: keyof Usuario) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  eliminar(usuario: Usuario) {
    this.onEliminar.emit(usuario);
  }
}

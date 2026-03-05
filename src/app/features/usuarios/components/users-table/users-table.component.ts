import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  // Recibe la lista de usuarios
  @Input({ required: true }) usuarios: Usuario[] = [];

  // Recibe el permiso para saber si dibuja los botones o no
  @Input() esAdmin: boolean = false;

  // Avisa hacia afuera cuando alguien toca "Eliminar"
  @Output() onEliminar = new EventEmitter<Usuario>();

  eliminar(usuario: Usuario) {
    this.onEliminar.emit(usuario);
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Usuario } from '../../../../models/usuario.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner.component/loading-spinner.component';
import { AlertErrorComponent } from '../../../../shared/components/alert-error/alert-error.component';
import { UsersTableComponent } from '../../components/users-table/users-table.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-usuario-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinnerComponent,
    AlertErrorComponent,
    UsersTableComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './usuarios-list-page.component.html',
})
export class UsuarioListPageComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  public authService = inject(AuthService);

  public usuarios = signal<Usuario[]>([]);
  public cargando = signal<boolean>(false);
  public searchTerm = signal<string>('');
  public error = signal<string | null>(null);
  public usuarioSeleccionado = signal<Usuario | null>(null);

  public isAdmin = computed(() => {
    const rolActual = this.authService.usuarioActual()?.rol;
    return rolActual === 'ADMIN' || rolActual === 'JEFE_GRUPO';
  });

  public usuariosFiltrados = computed(() => {
    const lista = this.usuarios();
    const busca = this.searchTerm().toLowerCase().trim();
    if (!busca) return lista;

    return lista.filter(
      (u) =>
        u.nombre.toLowerCase().includes(busca) ||
        u.apellido.toLowerCase().includes(busca) ||
        u.dni.toString().includes(busca) ||
        u.email.toLowerCase().includes(busca) ||
        u.rol.toLowerCase().includes(busca),
    );
  });

  ngOnInit() {
    this.cargarUsuarios();
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  cargarUsuarios(forzarRecarga: boolean = false) {
    this.cargando.set(true);
    this.error.set(null);

    // Si tuvieras un parámetro "forzarRecarga" en el servicio, lo pasarías acá
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la nómina de dirigentes.');
        this.cargando.set(false);
      },
    });
  }

  limpiarError() {
    this.error.set(null);
  }

  prepararBorrado(usuario: Usuario) {
    this.usuarioSeleccionado.set(usuario);
    const modal = document.getElementById('modal_borrar_usuario') as HTMLDialogElement;
    modal?.showModal();
  }

  confirmarBorrado() {
    const u = this.usuarioSeleccionado();
    if (u) {
      this.usuarioService.eliminarUsuario(u.id_usuario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.usuarioSeleccionado.set(null);
        },
      });
    }
  }
}

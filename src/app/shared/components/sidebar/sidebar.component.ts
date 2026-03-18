import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service'; // Asegurate de la ruta correcta
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);

  public usuarioActual = this.authService.usuarioActual;

  nombreCompleto(): string {
    const user = this.usuarioActual();
    return user ? `${user.nombre} ${user.apellido}` : 'Usuario';
  }

  cerrarSesion() {
    this.authService.logout();
  }

  // Cierra el cajón en pantallas chicas
  cerrarMenuEnMovil() {
    const drawerCheckbox = document.getElementById('main-drawer') as HTMLInputElement;
    if (drawerCheckbox && window.innerWidth < 1024) {
      drawerCheckbox.checked = false;
    }
  }
}

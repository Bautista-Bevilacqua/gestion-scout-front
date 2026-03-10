import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public usuarioActual = this.authService.usuarioActual;

  public nombreCompleto = computed(() => {
    const user = this.usuarioActual();
    if (!user) return 'Usuario Invitado';
    return `${user.nombre} ${user.apellido}`;
  });

  // 3. Creamos otra señal para sacar las iniciales (ej: "Juan Perez" -> "JP")
  public iniciales = computed(() => {
    const user = this.usuarioActual();
    if (!user) return '??';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  });

  // 4. Método para el botón de cerrar sesión
  cerrarSesion() {
    this.authService.logout();
  }
}

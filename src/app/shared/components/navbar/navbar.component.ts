import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public usuarioActual = this.authService.usuarioActual;

  public nombreCompleto = computed(() => {
    const user = this.usuarioActual();
    return user ? `${user.nombre} ${user.apellido}` : 'Usuario Invitado';
  });

  public iniciales = computed(() => {
    const user = this.usuarioActual();
    return user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase() : '??';
  });

  cerrarSesion() {
    this.authService.logout();
  }
}

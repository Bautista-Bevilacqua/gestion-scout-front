import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Señal para mostrar un cartel rojo si le pifia a la contraseña
  public errorMsg = signal<string | null>(null);
  public cargando = signal<boolean>(false);

  // Armamos el formulario con sus validaciones
  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ingresar() {
    if (this.loginForm.invalid) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (exito) => {
        if (exito) {
          const user = this.authService.usuarioActual();
          if (user?.debe_cambiar_password) {
            this.router.navigate(['/cambiar-password']);
          } else {
            this.router.navigate(['/beneficiarios']);
          }
        } else {
          this.errorMsg.set('Credenciales incorrectas. Verificá tu email y contraseña.');
          this.cargando.set(false);
        }
      },
      error: () => {
        this.errorMsg.set('Error al conectarse con el servidor.');
        this.cargando.set(false);
      },
    });
  }
}

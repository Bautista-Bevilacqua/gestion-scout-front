import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CustomValidators } from '../../../../core/utils/custom-validators';

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

  public errorMsg = signal<string | null>(null);
  public cargando = signal<boolean>(false);
  public mostrarPassword = signal<boolean>(false);
  public formEnviado = signal<boolean>(false);

  public loginForm = this.fb.group({
    email: ['', [Validators.required, CustomValidators.emailValido]],
    password: ['', [Validators.required]],
  });

  togglePassword() {
    this.mostrarPassword.update((valor) => !valor);
  }

  campoEsInvalido(campo: string): boolean {
    const control = this.loginForm.get(campo);
    return !!(control && control.invalid && this.formEnviado());
  }

  ingresar() {
    this.formEnviado.set(true);
    if (this.loginForm.invalid) {
      return;
    }

    this.cargando.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (exito) => {
        if (exito) {
          const user = this.authService.usuarioActual();
          if (user?.debe_cambiar_password) {
            this.router.navigate(['/change-password']);
          } else {
            this.router.navigate(['/']);
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

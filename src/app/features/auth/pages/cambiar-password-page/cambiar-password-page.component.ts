import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cambiar-password-page.component.html',
})
export class CambiarPasswordPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public errorMsg = signal<string | null>(null);
  public guardando = signal(false);

  public passForm = this.fb.group({
    nueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmacion: ['', [Validators.required]],
  });

  guardar() {
    if (this.passForm.invalid) return;

    const { nueva, confirmacion } = this.passForm.value;

    if (nueva !== confirmacion) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }

    this.guardando.set(true);
    this.errorMsg.set(null);

    this.authService.cambiarPassword(nueva!).subscribe((exito) => {
      if (exito) {
        // Si todo salió bien, lo mandamos al sistema principal
        this.router.navigate(['/beneficiarios']);
      } else {
        this.errorMsg.set('Hubo un error al actualizar la contraseña.');
        this.guardando.set(false);
      }
    });
  }
}

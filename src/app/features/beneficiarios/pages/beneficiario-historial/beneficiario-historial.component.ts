import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-historial-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './beneficiario-historial.component.html',
})
export class HistorialPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private beneficiarioService = inject(BeneficiarioService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  public idBeneficiario = 0;
  public beneficiario = signal<any>(null);
  public historial = signal<any[]>([]);
  public cargando = signal(true);
  public guardando = signal(false);

  public formRegistro = this.fb.group({
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit() {
    this.idBeneficiario = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos();
  }

  public isAdmin = computed(() => {
    const user = this.authService.usuarioActual();
    return user?.rol === 'ADMIN';
  });

  cargarDatos() {
    this.cargando.set(true);
    this.beneficiarioService
      .getBeneficiarioById(this.idBeneficiario)
      .subscribe((b) => this.beneficiario.set(b));

    this.beneficiarioService.getHistorial(this.idBeneficiario).subscribe({
      next: (data) => {
        this.historial.set(data);
        this.cargando.set(false);
      },
    });
  }

  agregarRegistro() {
    if (this.formRegistro.invalid) return;

    this.guardando.set(true);
    const desc = this.formRegistro.value.descripcion!;

    this.beneficiarioService.agregarAlHistorial(this.idBeneficiario, desc).subscribe({
      next: () => {
        this.formRegistro.reset();
        this.guardando.set(false);
        this.cargarDatos();
      },
      error: () => {
        alert('Error al guardar el registro');
        this.guardando.set(false);
      },
    });
  }
}

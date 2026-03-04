import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router'; // <-- Sumamos ActivatedRoute
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { Beneficiario } from '../../../../models/beneficiario.model';

@Component({
  selector: 'app-beneficiario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './beneficiario-form.component.html',
})
export class BeneficiarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private beneficiarioService = inject(BeneficiarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // <-- Para leer el ID de la URL

  // Variable para saber si estamos editando o creando
  public beneficiarioId: number | null = null;
  public cargando = signal<boolean>(false);
  public errorMsg = signal<string | null>(null);

  public beneficiarioForm = this.fb.group({
    id_familia: [1, Validators.required],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]],
    fecha_nacimiento: ['', Validators.required],
    rama_actual: ['Manada', Validators.required],
  });

  ngOnInit(): void {
    // Leemos el ID de la URL. Si existe, estamos en MODO EDICIÓN
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.beneficiarioId = Number(idParam);
      this.cargando.set(true);
      this.cargarDatos(this.beneficiarioId);
    }
  }

  cargarDatos(id: number) {
    this.beneficiarioService.getBeneficiarioById(id).subscribe({
      next: (data) => {
        const fechaFormateada = new Date(data.fecha_nacimiento).toISOString().split('T')[0];
        this.beneficiarioForm.patchValue({ ...data, fecha_nacimiento: fechaFormateada });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.errorMsg.set('No se pudo cargar la información del scout. Intente nuevamente.');
      },
    });
  }

  guardar() {
    if (this.beneficiarioForm.invalid) {
      this.beneficiarioForm.markAllAsTouched();
      return;
    }

    // 1. Obtenemos los datos con el tipo correcto
    const datos = this.beneficiarioForm.getRawValue() as Beneficiario;

    this.cargando.set(true);
    this.errorMsg.set(null); // Limpiamos errores previos

    // 2. Definimos la petición (Update o Create)
    const request = this.beneficiarioId
      ? this.beneficiarioService.updateBeneficiario(this.beneficiarioId, datos)
      : this.beneficiarioService.createBeneficiario(datos);

    // 3. Ejecutamos
    request.subscribe({
      next: () => {
        this.router.navigate(['/beneficiarios']);
      },
      error: (err) => {
        this.cargando.set(false);
        // Usamos el mensaje que viene del backend o uno genérico
        const mensaje = err.error?.message || 'Ocurrió un error al procesar la solicitud.';
        this.errorMsg.set(mensaje);
      },
    });
  }
}

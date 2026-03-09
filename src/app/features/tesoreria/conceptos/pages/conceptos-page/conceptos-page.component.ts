import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConceptoService } from '../../../../../core/services/concepto.service';
import { ConceptoCobro } from '../../../../../models/concepto-cobro.model';
import { AlertErrorComponent } from '../../../../../shared/components/alert-error/alert-error.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner.component/loading-spinner.component';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { AlertSuccessComponent } from "../../../../../shared/components/alert-success/alert-success.component";
import { GenerarCuotasModalComponent } from "../../components/generar-cuotas-modal/generar-cuotas-modal.component";

@Component({
  selector: 'app-conceptos-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertErrorComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    AlertSuccessComponent,
    GenerarCuotasModalComponent
],
  templateUrl: './conceptos-page.component.html',
})
export class ConceptosPageComponent implements OnInit {
  private conceptoService = inject(ConceptoService);
  private fb = inject(FormBuilder);

  public conceptos = signal<ConceptoCobro[]>([]);
  public cargando = signal(true);
  public guardando = signal(false);
  public errorMsg = signal<string | null>(null);
  public exitoMsg = signal<string | null>(null);
  public conceptoSeleccionado = signal<ConceptoCobro | null>(null);

  public conceptoForm = this.fb.group({
    nombre: ['', Validators.required],
    monto_base: ['', [Validators.required, Validators.min(0)]],
    alcance: ['GRUPO', Validators.required],
    fecha_vencimiento: [''],
  });

  ngOnInit() {
    this.cargarConceptos();
  }

  cargarConceptos(forzar = false) {
    this.cargando.set(true);
    this.conceptoService.getConceptos(forzar).subscribe({
      next: (data) => {
        this.conceptos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar los conceptos de cobro.');
        this.cargando.set(false);
      },
    });
  }

  abrirModal() {
    this.conceptoForm.reset({ alcance: 'GRUPO' });
    const modal = document.getElementById('modal_nuevo_concepto') as HTMLDialogElement;
    modal?.showModal();
  }

  cerrarModal() {
    const modal = document.getElementById('modal_nuevo_concepto') as HTMLDialogElement;
    modal?.close();
  }

  guardar() {
    if (this.conceptoForm.invalid) return;

    this.guardando.set(true);

    // 1. Extraemos los valores crudos del formulario
    const formValue = this.conceptoForm.value;

    // 2. Los empaquetamos asegurándole a TypeScript el tipo de dato correcto
    const nuevoConcepto: Partial<ConceptoCobro> = {
      nombre: formValue.nombre!, // El "!" le promete a TypeScript que esto no es null
      monto_base: Number(formValue.monto_base), // Lo convertimos a número real
      alcance: formValue.alcance as 'GRUPO' | 'MANADA' | 'UNIDAD' | 'CAMINANTES' | 'ROVERS',
      // Si no pusieron fecha, mandamos undefined para que la base de datos ponga NULL
      fecha_vencimiento: formValue.fecha_vencimiento ? formValue.fecha_vencimiento : undefined,
    };

    // 3. Ahora sí, mandamos el objeto perfecto al servicio
    this.conceptoService.crearConcepto(nuevoConcepto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarConceptos(true); // Recargamos la tabla
      },
      error: () => {
        this.errorMsg.set('Hubo un error al crear el concepto.');
        this.guardando.set(false);
      },
    });
  }

  prepararBorrado(concepto: ConceptoCobro) {
    this.conceptoSeleccionado.set(concepto);
    const modal = document.getElementById('modal_borrar_concepto') as HTMLDialogElement;
    modal?.showModal();
  }

  // 3. Método que se ejecuta cuando el usuario hace clic en "Eliminar" dentro del modal
  confirmarBorrado() {
    const concepto = this.conceptoSeleccionado();
    if (!concepto) return;

    this.cargando.set(true);

    this.conceptoService.eliminarConcepto(concepto.id_concepto).subscribe({
      next: () => {
        // Cerramos el modal
        const modal = document.getElementById('modal_borrar_concepto') as HTMLDialogElement;
        modal?.close();

        // Recargamos la lista
        this.cargarConceptos(true);
      },
      error: (err) => {
        // Cerramos el modal también si hay error para mostrar el cartel rojo
        const modal = document.getElementById('modal_borrar_concepto') as HTMLDialogElement;
        modal?.close();

        // Atajamos el error específico de la base de datos (ON DELETE RESTRICT)
        if (err.status === 400) {
          this.errorMsg.set(
            'No podés borrar este concepto porque ya hay beneficiarios que lo deben.',
          );
        } else {
          this.errorMsg.set('Hubo un error al intentar eliminar el concepto.');
        }
        this.cargando.set(false);
      },
    });
  }

  prepararAsignacion(concepto: ConceptoCobro) {
    this.conceptoSeleccionado.set(concepto);
    const modal = document.getElementById('modal_asignar_concepto') as HTMLDialogElement;
    modal?.showModal();
  }

  // 2. Ejecuta la orden cuando tocan el botón del modal
  confirmarAsignacion() {
    const concepto = this.conceptoSeleccionado();
    if (!concepto) return;

    this.cargando.set(true);
    this.errorMsg.set(null); // Limpiamos errores viejos
    this.exitoMsg.set(null); // Limpiamos éxitos viejos

    this.conceptoService.asignarConcepto(concepto.id_concepto).subscribe({
      next: (respuesta) => {
        const modal = document.getElementById('modal_asignar_concepto') as HTMLDialogElement;
        modal?.close();

        this.cargando.set(false);
        // ACÁ USAMOS NUESTRA SEÑAL LINDA
        this.exitoMsg.set(
          `¡Éxito! Se generaron ${respuesta.cantidad} nuevas deudas de "${concepto.nombre}".`,
        );
      },
      error: () => {
        const modal = document.getElementById('modal_asignar_concepto') as HTMLDialogElement;
        modal?.close();

        this.cargando.set(false);
        this.errorMsg.set('Hubo un error al intentar asignar las deudas.');
      },
    });
  }
}

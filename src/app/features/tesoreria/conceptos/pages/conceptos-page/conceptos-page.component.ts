import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConceptoService } from '../../../../../core/services/concepto.service';
import { ConceptoCobro } from '../../../../../models/concepto-cobro.model';
import { AlertErrorComponent } from '../../../../../shared/components/alert-error/alert-error.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner.component/loading-spinner.component';
import { ConfirmModalComponent } from '../../../../../shared/components/confirm-modal/confirm-modal.component';
import { AlertSuccessComponent } from '../../../../../shared/components/alert-success/alert-success.component';
import { GenerarCuotasModalComponent } from '../../components/generar-cuotas-modal/generar-cuotas-modal.component';

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
    GenerarCuotasModalComponent,
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

  public conceptosConAlerta = computed(() => {
    const hoyStr = new Date().toISOString().split('T')[0];

    return this.conceptos().map((con: any) => {
      if (!con.fecha_vencimiento) return { ...con, vencido: false };

      const venStr = con.fecha_vencimiento.split('T')[0];
      return {
        ...con,
        vencido: venStr < hoyStr, 
      };
    });
  });

  public conceptoForm = this.fb.group({
    nombre: ['', Validators.required],
    monto_efectivo: ['', [Validators.required, Validators.min(0)]],
    monto_transferencia: ['', [Validators.required, Validators.min(0)]],
    alcance: ['GRUPO', Validators.required],
    fecha_vencimiento: [''],
  });

  public actualizarForm = this.fb.group({
    monto_efectivo: ['', [Validators.required, Validators.min(0)]],
    monto_transferencia: ['', [Validators.required, Validators.min(0)]],
    fecha_vencimiento: ['', Validators.required], 
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
    const formValue = this.conceptoForm.value;

    const nuevoConcepto: Partial<ConceptoCobro> = {
      nombre: formValue.nombre!,
      monto_efectivo: Number(formValue.monto_efectivo),
      monto_transferencia: Number(formValue.monto_transferencia),
      alcance: formValue.alcance as 'GRUPO' | 'MANADA' | 'UNIDAD' | 'CAMINANTES' | 'ROVERS',
      fecha_vencimiento: formValue.fecha_vencimiento ? formValue.fecha_vencimiento : undefined,
    };

    this.conceptoService.crearConcepto(nuevoConcepto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarConceptos(true);
      },
      error: () => {
        this.errorMsg.set('Hubo un error al crear el concepto.');
        this.guardando.set(false);
      },
    });
  }

  prepararActualizacion(concepto: any) {
    this.conceptoSeleccionado.set(concepto);

    const fechaLimpia = concepto.fecha_vencimiento ? concepto.fecha_vencimiento.split('T')[0] : '';

    this.actualizarForm.patchValue({
      monto_efectivo: concepto.monto_efectivo.toString(),
      monto_transferencia: concepto.monto_transferencia.toString(),
      fecha_vencimiento: fechaLimpia,
    });

    const modal = document.getElementById('modal_actualizar_precio') as HTMLDialogElement;
    modal?.showModal();
  }

  confirmarActualizacion() {
    if (this.actualizarForm.invalid) return;
    const concepto = this.conceptoSeleccionado();
    if (!concepto) return;

    this.guardando.set(true);
    const formValue = this.actualizarForm.value;

    const datosNuevos = {
      monto_efectivo: Number(formValue.monto_efectivo),
      monto_transferencia: Number(formValue.monto_transferencia),
      fecha_vencimiento: formValue.fecha_vencimiento,
    };

    this.conceptoService.actualizarPrecio(concepto.id_concepto, datosNuevos).subscribe({
      next: () => {
        this.guardando.set(false);
        (document.getElementById('modal_actualizar_precio') as HTMLDialogElement)?.close();
        this.exitoMsg.set(
          `¡Se actualizó el valor y se ajustaron las deudas pendientes de ${concepto.nombre}!`,
        );
        this.cargarConceptos(true);
      },
      error: () => {
        this.errorMsg.set('Hubo un error al intentar actualizar los precios.');
        this.guardando.set(false);
      },
    });
  }

  prepararBorrado(concepto: ConceptoCobro) {
    this.conceptoSeleccionado.set(concepto);
    const modal = document.getElementById('modal_borrar_concepto') as HTMLDialogElement;
    modal?.showModal();
  }

  confirmarBorrado() {
    const concepto = this.conceptoSeleccionado();
    if (!concepto) return;
    this.cargando.set(true);

    this.conceptoService.archivarConcepto(concepto.id_concepto).subscribe({
      next: () => {
        (document.getElementById('modal_archivar_concepto') as HTMLDialogElement)?.close();
        this.exitoMsg.set(`El concepto "${concepto.nombre}" fue ocultado exitosamente.`);
        this.cargarConceptos(true);
      },
      error: (err) => {
        (document.getElementById('modal_archivar_concepto') as HTMLDialogElement)?.close();

        if (err.status === 400) {
          this.errorMsg.set(err.error?.message || 'No se puede ocultar, alguien debe plata.');
        } else {
          this.errorMsg.set('Hubo un error al intentar ocultar el concepto.');
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

  confirmarAsignacion() {
    const concepto = this.conceptoSeleccionado();
    if (!concepto) return;

    this.cargando.set(true);
    this.errorMsg.set(null);
    this.exitoMsg.set(null);

    this.conceptoService.asignarConcepto(concepto.id_concepto).subscribe({
      next: (respuesta) => {
        (document.getElementById('modal_asignar_concepto') as HTMLDialogElement)?.close();
        this.cargando.set(false);
        this.exitoMsg.set(
          `¡Éxito! Se generaron ${respuesta.cantidad} nuevas deudas de "${concepto.nombre}".`,
        );
      },
      error: () => {
        (document.getElementById('modal_asignar_concepto') as HTMLDialogElement)?.close();
        this.cargando.set(false);
        this.errorMsg.set('Hubo un error al intentar asignar las deudas.');
      },
    });
  }

  archivarPagados() {
    this.cargando.set(true);
    this.errorMsg.set(null);
    this.exitoMsg.set(null);

    this.conceptoService.archivarPagados().subscribe({
      next: (res) => {
        if (res.cantidad > 0) {
          this.exitoMsg.set(
            `¡Limpieza exitosa! Se ocultaron ${res.cantidad} conceptos que ya estaban 100% pagados por todos.`,
          );
        } else {
          this.errorMsg.set(
            'No hay conceptos completamente pagados para archivar en este momento. Alguien todavía debe plata.',
          );
        }
        this.cargarConceptos(true);
      },
      error: () => {
        this.errorMsg.set('Error al intentar archivar los conceptos.');
        this.cargando.set(false);
      },
    });
  }
}

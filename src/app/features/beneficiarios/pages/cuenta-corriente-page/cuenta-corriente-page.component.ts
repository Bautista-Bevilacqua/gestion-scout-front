import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CargoService } from '../../../../core/services/cargo.service';
import { BeneficiarioService } from '../../../../core/services/beneficiario.service';
import { ConceptoService } from '../../../../core/services/concepto.service';
import { Cargo } from '../../../../models/cargo.model';
import { Beneficiario } from '../../../../models/beneficiario.model';
import { ConceptoCobro } from '../../../../models/concepto-cobro.model';
import { ConfirmarPagoModalComponent } from '../../../../shared/components/confirmar-pago-modal/confirmar-pago.modal.component';
import { ConfirmModalComponent } from "../../../../shared/components/confirm-modal/confirm-modal.component";

@Component({
  selector: 'app-cuenta-corriente-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmarPagoModalComponent, ConfirmModalComponent],
  templateUrl: './cuenta-corriente-page.component.html',
})
export class CuentaCorrientePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cargoService = inject(CargoService);
  private beneficiarioService = inject(BeneficiarioService);
  private conceptoService = inject(ConceptoService);

  public beneficiario = signal<Beneficiario | null>(null);
  public cargos = signal<Cargo[]>([]);
  public conceptosDisponibles = signal<ConceptoCobro[]>([]);
  public cargando = signal(true);
  public deudaTotal = signal(0);
  public cargoABorrar = signal<any | null>(null);

  public seleccionados = signal<Set<number>>(new Set());

  public totalSeleccionadoEfectivo = computed(() => {
    return this.cargos()
      .filter((c) => this.seleccionados().has(c.id_cargo))
      .reduce((acc, curr) => {
        const restante = Number(curr.monto_efectivo) - Number(curr.total_pagado || 0);
        return acc + (restante > 0 ? restante : 0);
      }, 0);
  });

  public totalSeleccionadoTransferencia = computed(() => {
    return this.cargos()
      .filter((c) => this.seleccionados().has(c.id_cargo))
      .reduce((acc, curr) => {
        const restante = Number(curr.monto_transferencia) - Number(curr.total_pagado || 0);
        return acc + (restante > 0 ? restante : 0);
      }, 0);
  });

  public historialPagosGlobal = computed(() => {
    const todosLosPagos: any[] = [];

    for (const c of this.cargos()) {
      if ((c.total_pagado || 0) > 0 && c.historial_pagos && c.historial_pagos.length > 0) {
        for (const pago of c.historial_pagos) {
          todosLosPagos.push({
            ...pago,
            concepto_nombre: c.concepto_nombre,
            cargo_estado: c.estado,
            historial_length: c.historial_pagos.length,
          });
        }
      }
    }

    return todosLosPagos.sort((a, b) => {
      return new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime();
    });
  });

  public cargoAAsignar = signal<any | null>(null);
  public procesandoPago = signal(false);
  public conceptoSeleccionadoId = signal<number | null>(null);
  public guardando = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos(id);
  }

  cargarDatos(id: number) {
    this.cargando.set(true);
    this.seleccionados.set(new Set());

    this.beneficiarioService.getBeneficiarioById(id).subscribe((b) => this.beneficiario.set(b));

    this.cargoService.getCargosPorBeneficiario(id).subscribe({
      next: (data) => {
        const dataNumerica = data.map((c) => {
          const pagado = Number(c.total_pagado || 0);
          const efvo = Number(c.monto_efectivo);
          const transf = Number(c.monto_transferencia);

          return {
            ...c,
            monto_efectivo: efvo,
            monto_transferencia: transf,
            total_pagado: pagado,
            deuda_efectivo_restante: efvo - pagado,
            deuda_transferencia_restante: transf - pagado,
          };
        });

        this.cargos.set(dataNumerica);

        const total = dataNumerica
          .filter((c) => c.estado === 'PENDIENTE' || c.estado === 'PARCIAL')
          .reduce((acc, curr) => acc + (curr.deuda_efectivo_restante || 0), 0);

        this.deudaTotal.set(total);
        this.cargando.set(false);
      },
    });

    this.conceptoService.getConceptosDisponibles(id).subscribe((c) => {
      this.conceptosDisponibles.set(c);
    });
  }

  toggleSeleccion(id: number) {
    const nuevos = new Set(this.seleccionados());
    if (nuevos.has(id)) {
      nuevos.delete(id);
    } else {
      nuevos.add(id);
    }
    this.seleccionados.set(nuevos);
  }

  prepararCobro(cargo: Cargo) {
    this.seleccionados.set(new Set([cargo.id_cargo]));

    this.cargoAAsignar.set({
      ...cargo,
      es_multiple: false,
      deuda_efectivo: Number(cargo.monto_efectivo) - Number(cargo.total_pagado || 0),
      deuda_transferencia: Number(cargo.monto_transferencia) - Number(cargo.total_pagado || 0),
    });
    this.abrirModal();
  }

  prepararCobroMultiple() {
    if (this.seleccionados().size === 0) return;

    if (this.seleccionados().size === 1) {
      const idUnico = Array.from(this.seleccionados())[0];
      const cargoUnico = this.cargos().find((c) => c.id_cargo === idUnico);
      if (cargoUnico) {
        this.prepararCobro(cargoUnico);
        return;
      }
    }

    this.cargoAAsignar.set({
      es_multiple: true,
      concepto_nombre: `${this.seleccionados().size} conceptos seleccionados`,
      monto_efectivo: this.totalSeleccionadoEfectivo(),
      monto_transferencia: this.totalSeleccionadoTransferencia(),
    });
    this.abrirModal();
  }

  private abrirModal() {
    const modal = document.getElementById('modal_confirmar_pago') as HTMLDialogElement;
    modal?.showModal();
  }

  prepararBorradoCargo(cargo: Cargo) {
    this.cargoABorrar.set(cargo);
    const modal = document.getElementById('modal_borrar_cargo') as HTMLDialogElement;
    modal?.showModal();
  }

  confirmarBorradoCargo() {
    const cargo = this.cargoABorrar();
    const idBeneficiario = this.beneficiario()?.id_beneficiario;
    if (!cargo || !idBeneficiario) return;

    this.procesandoPago.set(true); 

    this.cargoService.eliminarCargo(cargo.id_cargo).subscribe({
      next: () => {
        (document.getElementById('modal_borrar_cargo') as HTMLDialogElement)?.close();
        this.cargoABorrar.set(null);
        this.procesandoPago.set(false);
        this.cargarDatos(idBeneficiario);
      },
      error: (err: any) => {
        (document.getElementById('modal_borrar_cargo') as HTMLDialogElement)?.close();
        this.procesandoPago.set(false);
        alert(err.error?.message || 'Error al intentar quitar la deuda.');
      },
    });
  }

  cerrarModalCobro() {
    const modal = document.getElementById('modal_confirmar_pago') as HTMLDialogElement;
    modal?.close();
    this.cargoAAsignar.set(null);
  }

  ejecutarPago(eventoPagos: any) {
    const ids = Array.from(this.seleccionados());
    const idBeneficiario = this.beneficiario()?.id_beneficiario;

    if (ids.length === 0 || !idBeneficiario) return;

    this.procesandoPago.set(true);

    const metodo = typeof eventoPagos === 'string' ? eventoPagos : eventoPagos.metodo;
    const montoParcial = typeof eventoPagos === 'string' ? undefined : eventoPagos.monto;

    if (this.cargoAAsignar()?.es_multiple) {
      this.cargoService.pagarMultiplesCargos(ids, metodo).subscribe({
        next: () => this.finalizarPagoExitosa(idBeneficiario),
        error: (err: any) => this.manejarErrorPago(err),
      });
    } else {
      const idCargo = ids[0];

      const deudaTotalSegunMetodo =
        metodo === 'EFECTIVO'
          ? this.cargoAAsignar()?.deuda_efectivo
          : this.cargoAAsignar()?.deuda_transferencia;

      const montoAbonado = montoParcial || deudaTotalSegunMetodo;

      this.cargoService.registrarPago(idCargo, metodo, montoAbonado).subscribe({
        next: () => this.finalizarPagoExitosa(idBeneficiario),
        error: (err: any) => this.manejarErrorPago(err),
      });
    }
  }

  private finalizarPagoExitosa(idBeneficiario: number) {
    this.procesandoPago.set(false);
    this.cerrarModalCobro();
    this.cargarDatos(idBeneficiario);
  }

  private manejarErrorPago(err: any) {
    this.procesandoPago.set(false);
    alert(err.error?.message || 'Error al procesar el pago');
  }

  onSelectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.conceptoSeleccionadoId.set(Number(value));
  }

  asignarConceptoManual() {
    const idConcepto = this.conceptoSeleccionadoId();
    const idBeneficiario = this.beneficiario()?.id_beneficiario;
    if (!idConcepto || !idBeneficiario) return;

    this.guardando.set(true);
    this.cargoService.asignarIndividual(idBeneficiario, idConcepto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.conceptoSeleccionadoId.set(null);
        this.cargarDatos(idBeneficiario);
      },
      error: () => {
        alert('Error al asignar la deuda');
        this.guardando.set(false);
      },
    });
  }
}

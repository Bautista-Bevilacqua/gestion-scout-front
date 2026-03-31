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

@Component({
  selector: 'app-cuenta-corriente-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmarPagoModalComponent],
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

  public seleccionados = signal<Set<number>>(new Set());

  // MATEMÁTICA CORREGIDA: Sumamos solo lo que FALTA pagar
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
        // Hacemos la matemática acá para que el HTML no sufra
        const dataNumerica = data.map((c) => {
          const pagado = Number(c.total_pagado || 0);
          const efvo = Number(c.monto_efectivo);
          const transf = Number(c.monto_transferencia);

          return {
            ...c,
            monto_efectivo: efvo,
            monto_transferencia: transf,
            total_pagado: pagado,
            // Guardamos la resta ya lista para usar
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

    // Le pasamos la deuda real y un flag indicando que es pago individual (permite parciales)
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

    // MAGIA DE UX: Si seleccionó 1 solo elemento desde el checkbox,
    // lo mandamos al flujo de "Pago Individual" para que le aparezca el input.
    if (this.seleccionados().size === 1) {
      const idUnico = Array.from(this.seleccionados())[0];
      const cargoUnico = this.cargos().find((c) => c.id_cargo === idUnico);
      if (cargoUnico) {
        this.prepararCobro(cargoUnico);
        return;
      }
    }

    // Si seleccionó 2 o más, va al flujo de "Carrito Múltiple" (sin input)
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

  cerrarModalCobro() {
    const modal = document.getElementById('modal_confirmar_pago') as HTMLDialogElement;
    modal?.close();
    this.cargoAAsignar.set(null);
  }

  // Ahora recibe un objeto { metodo: string, monto: number } desde el modal
  ejecutarPago(eventoPagos: any) {
    const ids = Array.from(this.seleccionados());
    const idBeneficiario = this.beneficiario()?.id_beneficiario;

    if (ids.length === 0 || !idBeneficiario) return;

    this.procesandoPago.set(true);

    const metodo = typeof eventoPagos === 'string' ? eventoPagos : eventoPagos.metodo;
    const montoParcial = typeof eventoPagos === 'string' ? undefined : eventoPagos.monto;

    // 1. PAGO MÚLTIPLE (Paga todo el resto de lo seleccionado)
    if (this.cargoAAsignar()?.es_multiple) {
      this.cargoService.pagarMultiplesCargos(ids, metodo).subscribe({
        next: () => this.finalizarPagoExitosa(idBeneficiario),
        error: (err: any) => this.manejarErrorPago(err),
      });
    } else {
      // 2. PAGO INDIVIDUAL
      const idCargo = ids[0];

      // PARCHE: Si no es parcial, miramos qué método tocó para saber cuánta era la deuda total correcta
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

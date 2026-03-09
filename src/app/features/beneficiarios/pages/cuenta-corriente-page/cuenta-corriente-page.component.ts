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

  // --- DATOS BÁSICOS ---
  public beneficiario = signal<Beneficiario | null>(null);
  public cargos = signal<Cargo[]>([]);
  public conceptosDisponibles = signal<ConceptoCobro[]>([]);
  public cargando = signal(true);
  public deudaTotal = signal(0); // Deuda histórica total del chico

  // --- LÓGICA DE SELECCIÓN MÚLTIPLE (CARRITO) ---
  public seleccionados = signal<Set<number>>(new Set());

  // Este se recalcula solo cada vez que tildás/destildás algo
  public totalSeleccionado = computed(() => {
    return this.cargos()
      .filter((c) => this.seleccionados().has(c.id_cargo))
      .reduce((acc, curr) => acc + Number(curr.monto_final), 0);
  });

  // --- LÓGICA DE COBRO ---
  public cargoAAsignar = signal<Partial<Cargo> | null>(null);
  public procesandoPago = signal(false);

  // --- LÓGICA DE ASIGNACIÓN INDIVIDUAL ---
  public conceptoSeleccionadoId = signal<number | null>(null);
  public guardando = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos(id);
  }

  cargarDatos(id: number) {
    this.cargando.set(true);
    // Limpiamos selección al recargar para evitar IDs viejos
    this.seleccionados.set(new Set());

    this.beneficiarioService.getBeneficiarioById(id).subscribe((b) => this.beneficiario.set(b));

    this.cargoService.getCargosPorBeneficiario(id).subscribe({
      next: (data) => {
        this.cargos.set(data);
        const total = data
          .filter((c) => c.estado === 'PENDIENTE')
          .reduce((acc, curr) => acc + Number(curr.monto_final), 0);
        this.deudaTotal.set(total);
        this.cargando.set(false);
      },
    });

    this.conceptoService.getConceptosDisponibles(id).subscribe((c) => {
      this.conceptosDisponibles.set(c);
    });
  }

  // --- MANEJO DE SELECCIÓN ---
  toggleSeleccion(id: number) {
    const nuevos = new Set(this.seleccionados());
    if (nuevos.has(id)) {
      nuevos.delete(id);
    } else {
      nuevos.add(id);
    }
    this.seleccionados.set(nuevos);
  }

  // --- ACCIONES DE COBRO ---

  // Cobrar uno solo (botón de la tabla)
  prepararCobro(cargo: Cargo) {
    this.seleccionados.set(new Set([cargo.id_cargo])); // Lo marcamos como único seleccionado
    this.cargoAAsignar.set(cargo);
    this.abrirModal();
  }

  // Cobrar todos los tildados (botón de la barra flotante)
  prepararCobroMultiple() {
    if (this.seleccionados().size === 0) return;

    this.cargoAAsignar.set({
      concepto_nombre: `${this.seleccionados().size} conceptos seleccionados`,
      monto_final: this.totalSeleccionado(),
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

  ejecutarPago(metodo: string) {
    const ids = Array.from(this.seleccionados());
    const idBeneficiario = this.beneficiario()?.id_beneficiario;

    if (ids.length === 0 || !idBeneficiario) return;

    this.procesandoPago.set(true);

    // Usamos el servicio para pagar múltiples IDs de una
    this.cargoService.pagarMultiplesCargos(ids, metodo).subscribe({
      next: () => {
        this.procesandoPago.set(false);
        this.cerrarModalCobro();
        this.cargarDatos(idBeneficiario); // Recargamos todo
      },
      error: (err) => {
        this.procesandoPago.set(false);
        alert(err.error?.message || 'Error al procesar el pago múltiple');
      },
    });
  }

  // --- ASIGNACIÓN DE NUEVAS DEUDAS ---
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

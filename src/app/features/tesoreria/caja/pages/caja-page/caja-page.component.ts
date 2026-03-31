import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../../../../core/services/caja.service';
import { MovimientoCaja } from '../../../../../models/caja.model';
import { CajaTableComponent } from '../../components/caja-table/caja-table.component';
import { NuevoMovimientoModalComponent } from '../../components/nuevo-movimiento-caja/nuevo-movimiento-caja.component';

@Component({
  selector: 'app-caja-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CajaTableComponent, NuevoMovimientoModalComponent],
  templateUrl: './caja-page.component.html',
})
export class CajaPageComponent implements OnInit {
  private cajaService = inject(CajaService);

  public movimientos = signal<MovimientoCaja[]>([]);
  public cargando = signal(false);

  public fechaDesde = signal<string>('');
  public fechaHasta = signal<string>('');

  public totalIngresos = computed(() => {
    return this.movimientos()
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + Number(m.monto), 0);
  });

  public totalEgresos = computed(() => {
    return this.movimientos()
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + Number(m.monto), 0);
  });

  public balanceTotal = computed(() => {
    return this.totalIngresos() - this.totalEgresos();
  });

  ngOnInit() {
    this.cargarCaja();
  }

  cargarCaja(forzarRecarga: boolean = false) {
    this.cargando.set(true);

    this.cajaService.getMovimientos(this.fechaDesde(), this.fechaHasta(), forzarRecarga).subscribe({
      next: (datos) => {
        this.movimientos.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        console.error('Error al cargar la caja');
        this.cargando.set(false);
      },
    });
  }

  filtrarHoy() {
    const hoy = new Date().toISOString().split('T')[0];

    this.fechaDesde.set(hoy);
    this.fechaHasta.set(hoy);
    this.cargarCaja();
  }

  filtrarEsteMes() {
    const fecha = new Date();
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    this.fechaDesde.set(primerDia);
    this.fechaHasta.set(ultimoDia);
    this.cargarCaja();
  }

  filtrarEsteAnio() {
    const anio = new Date().getFullYear();
    this.fechaDesde.set(`${anio}-01-01`);
    this.fechaHasta.set(`${anio}-12-31`);
    this.cargarCaja();
  }

  aplicarFiltros() {
    this.cargarCaja();
  }

  limpiarFiltros() {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.cargarCaja();
  }
}

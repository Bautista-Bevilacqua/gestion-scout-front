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

  cargarCaja() {
    this.cargando.set(true);
    this.cajaService.getMovimientos(this.fechaDesde(), this.fechaHasta()).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });
  }

  filtrarHoy() {
    // Genera la fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];

    this.fechaDesde.set(hoy);
    this.fechaHasta.set(hoy);
    this.cargarCaja();
  }

  filtrarEsteMes() {
    const fecha = new Date();
    // Día 1 del mes actual
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    // Día 0 del mes siguiente = Último día del mes actual
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    this.fechaDesde.set(primerDia);
    this.fechaHasta.set(ultimoDia);
    this.cargarCaja();
  }

  filtrarEsteAnio() {
    const anio = new Date().getFullYear();
    // Del 1 de enero al 31 de diciembre del año en curso
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

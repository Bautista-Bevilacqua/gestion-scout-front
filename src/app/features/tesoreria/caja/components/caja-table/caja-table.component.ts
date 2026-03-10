import { Component, computed, signal, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MovimientoCaja } from '../../../../../models/caja.model';

@Component({
  selector: 'app-caja-table',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe], // Para formatear la fecha lindo en el HTML
  templateUrl: './caja-table.component.html',
})
export class CajaTableComponent {
  movimientos = input.required<MovimientoCaja[]>();

  public sortField = signal<keyof MovimientoCaja>('fecha');
  public sortDirection = signal<'asc' | 'desc'>('desc'); // Por defecto, los más nuevos arriba

  public movimientosOrdenados = computed(() => {
    const lista = this.movimientos();
    const field = this.sortField();
    const direction = this.sortDirection();

    return [...lista].sort((a, b) => {
      let valA: any = a[field];
      let valB: any = b[field];

      // Lógica especial para fechas
      if (field === 'fecha') {
        valA = new Date(a.fecha).getTime();
        valB = new Date(b.fecha).getTime();
      }
      // Lógica especial para números (monto)
      else if (field === 'monto') {
        valA = Number(a.monto);
        valB = Number(b.monto);
      }
      // Lógica para textos
      else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  cambiarOrden(field: keyof MovimientoCaja) {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }
}

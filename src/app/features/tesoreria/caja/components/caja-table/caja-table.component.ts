import { Component, computed, signal, input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MovimientoCaja } from '../../../../../models/caja.model';
import { ExportService } from '../../../../../core/services/export.service';

@Component({
  selector: 'app-caja-table',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe], // Para formatear la fecha lindo en el HTML
  templateUrl: './caja-table.component.html',
})
export class CajaTableComponent {
  private exportService = inject(ExportService);
  private datePipe = inject(DatePipe);

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

  descargarExcel() {
    const datosParaExcel = this.movimientosOrdenados().map((m) => {
      // Juntamos la data del responsable en un solo texto legible
      const responsable = m.persona_involucrada
        ? `${m.persona_involucrada} (Sist: ${m.usuario_nombre || 'Auto'})`
        : `Sist: ${m.usuario_nombre || 'Automático'}`;

      return {
        Fecha: this.datePipe.transform(m.fecha, 'dd/MM/yyyy HH:mm') || m.fecha,
        Tipo: m.tipo,
        Concepto: m.concepto,
        Responsable: responsable,
        Comprobante: m.comprobante ? 'Sí' : 'No',
        Monto: Number(m.monto), // Forzamos a número para que Excel lo sume bien
      };
    });

    this.exportService.exportarExcel(datosParaExcel, 'Movimientos_Caja_Grupo108');
  }

  // 👇 FUNCIÓN PARA PDF
  descargarPDF() {
    const columnas = ['Fecha', 'Tipo', 'Concepto', 'Responsable', 'Comprobante', 'Monto'];

    const datosParaPDF = this.movimientosOrdenados().map((m) => {
      const responsable = m.persona_involucrada
        ? `${m.persona_involucrada} (Sist: ${m.usuario_nombre || 'Auto'})`
        : `Sist: ${m.usuario_nombre || 'Automático'}`;

      return [
        this.datePipe.transform(m.fecha, 'dd/MM/yyyy HH:mm') || m.fecha,
        m.tipo,
        m.concepto,
        responsable,
        m.comprobante ? 'Sí' : '-',
        `$ ${Number(m.monto).toLocaleString('es-AR')}`, // Formato plata: $ 1.500
      ];
    });

    this.exportService.exportarPDF(
      columnas,
      datosParaPDF,
      'Movimientos_Caja_Grupo108',
      'Reporte de Caja - Tesorería',
    );
  }
}

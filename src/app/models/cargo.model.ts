export interface Cargo {
  id_cargo: number;
  monto_final: string | number;
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  fecha_cargo: string;
  concepto_nombre: string;
  fecha_vencimiento?: string;
  fecha_pago?: string;
  metodo_pago?: string;
  cobrador_nombre?: string;
  cobrador_apellido?: string;
}

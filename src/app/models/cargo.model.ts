export interface Cargo {
  id_cargo: number;
  monto_efectivo: string | number;
  monto_transferencia: string | number;
  monto_pagado?: string | number;
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  fecha_cargo: string;
  concepto_nombre: string;
  fecha_vencimiento?: string;
  fecha_pago?: string;
  metodo_pago?: string;
  cobrador_nombre?: string;
  cobrador_apellido?: string;
}

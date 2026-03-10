export interface MovimientoCaja {
  id_movimiento: number;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: string | number;
  concepto: string;
  comprobante?: string;
  id_usuario?: number;
  id_pago?: number;
  usuario_nombre?: string;
  usuario_apellido?: string;
  persona_involucrada?: string;
}

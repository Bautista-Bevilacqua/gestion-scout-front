export interface ConceptoCobro {
  id_concepto: number;
  nombre: string;
  monto_base: number;
  alcance: 'GRUPO' | 'MANADA' | 'UNIDAD' | 'CAMINANTES' | 'ROVERS';
  fecha_vencimiento?: Date | string;
  fecha_creacion?: Date | string;
}

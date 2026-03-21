export interface Evento {
  id_evento: number;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  alcance: string;
  color: string;
  id_usuario: number;
}

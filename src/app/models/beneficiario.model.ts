export interface Beneficiario {
  id_beneficiario: number;
  id_familia: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  rama_actual: 'Manada' | 'Unidad' | 'Caminantes' | 'Rovers';
}

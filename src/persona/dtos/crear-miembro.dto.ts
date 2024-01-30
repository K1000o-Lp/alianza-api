import { crearHistorialMiembroDto } from 'src/organizacion/dtos/crear-historial-miembro.dto';

export interface CrearMiembroDto {
  cedula: string;

  nombre_completo: string;

  telefono: string;

  fecha_nacimiento: Date;

  hijos: number;

  educacion_fk_id: number;

  estado_civil_fk_id: number;

  ocupacion_fk_id: number;

  discapacidad_fk_id: number;

  historial: crearHistorialMiembroDto;
}

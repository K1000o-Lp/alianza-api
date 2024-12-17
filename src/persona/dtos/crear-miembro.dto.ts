import { crearHistorialMiembroDto } from 'src/organizacion/dtos/crear-historial-miembro.dto';

export interface CrearMiembroDto {
  cedula: string;

  nombre_completo: string;

  telefono: string;

  fecha_nacimiento: Date;

  hijos: number;

  educacion_id: number;

  estado_civil_id: number;

  ocupacion_id: number;

  discapacidad_id: number;

  historial: crearHistorialMiembroDto;

  requisito: {
    requisito_ids: number[];
  }
}

import { actualizarCompetenciaDto } from './actualizar-competencia.dto';

export interface actualizarEvaluacionDto {
  evaluacion_id?: number;
  competencia?: actualizarCompetenciaDto;
}

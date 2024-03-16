import { Body, Controller, Get, Put } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { actualizarEvaluacionDto } from './dtos';

@Controller('formacion')
export class FormacionController {
  constructor(private formacionService: FormacionService) {}

  @Get('formaciones')
  async obtenerFormaciones() {
    return await this.formacionService.obtenerFormaciones();
  }

  @Get('requisitos')
  async obtenerRequisitos() {
    return await this.formacionService.obtenerRequisitos();
  }

  @Get('competencias')
  async obtenerCompetencias() {
    return await this.formacionService.obtenerCompetencias();
  }

  @Put('evaluaciones')
  async actualizarEvaluaciones(
    @Body()
    actualizarEvaluacionesDto: actualizarEvaluacionDto[],
  ) {
    return await this.formacionService.actualizarEvaluaciones(
      actualizarEvaluacionesDto,
    );
  }
}

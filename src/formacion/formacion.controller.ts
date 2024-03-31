import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { actualizarEvaluacionDto, crearEventoDto } from './dtos';

@Controller('formacion')
export class FormacionController {
  constructor(private formacionService: FormacionService) {}

  @Get('formaciones')
  obtenerFormaciones() {
    return this.formacionService.obtenerFormaciones();
  }

  @Get('requisitos')
  obtenerRequisitos() {
    return this.formacionService.obtenerRequisitos();
  }

  @Put('evaluaciones')
  actualizarEvaluaciones(
    @Body()
    actualizarEvaluacionesDto: actualizarEvaluacionDto[],
  ) {
    return this.formacionService.actualizarEvaluaciones(
      actualizarEvaluacionesDto,
    );
  }

  @Post('eventos')
  crearEventos(
    @Body()
    crearEventoDto: crearEventoDto,
  ) {
    return this.formacionService.crearEvento(crearEventoDto);
  }
}

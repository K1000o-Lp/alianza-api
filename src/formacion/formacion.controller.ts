import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { crearEventoDto, crearResultadoDto } from './dtos';

@Controller('formacion')
export class FormacionController {
  constructor(private formacionService: FormacionService) {}

  @Get('formaciones')
  obtenerFormaciones() {
    return this.formacionService.obtenerFormaciones();
  }

  @Get('requisitos')
  obtenerRequisitos(
    @Query()
    options: {
      requisitos?: string;
    },
  ) {
    return this.formacionService.obtenerRequisitos(options);
  }

  @Post('resultados')
  crearResultado(
    @Body()
    dto: crearResultadoDto,
  ) {
    return this.formacionService.crearResultado(dto);
  }

  @Post('eventos')
  crearEventos(
    @Body()
    crearEventoDto: crearEventoDto,
  ) {
    return this.formacionService.crearEvento(crearEventoDto);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { crearEventoDto, crearResultadoDto } from './dtos';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';

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

  @Delete('resultados/:id')
  eliminarResultado(@Param('id') id: string) {
    return this.formacionService.eliminarResultado(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resultados/sesion')
  registrarResultadoPorSesion(
    @Req() req: Request,
    @Body() dto: { requisito_id: number },
  ) {
    const session = (req as any).user?.session;
    const miembro_id = session?.miembro?.id;

    if (!miembro_id) {
      throw new UnauthorizedException('Usuario sin miembro asociado');
    }

    return this.formacionService.registrarResultadoPorSesion(miembro_id, dto.requisito_id);
  }

  @Post('eventos')
  crearEventos(
    @Body()
    crearEventoDto: crearEventoDto,
  ) {
    return this.formacionService.crearEvento(crearEventoDto);
  }
}

import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { CrearMiembroDto } from './dtos/crear-miembro.dto';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { Response } from 'express';

@Controller('persona')
export class PersonaController {
  constructor(private personaService: PersonaService) {}

  @Get('discapacidades')
  obtenerDiscapacidades(): Promise<Discapacidad[]> {
    return this.personaService.obtenerDiscapacidades();
  }

  @Get('educaciones')
  obtenerEducaciones(): Promise<Educacion[]> {
    return this.personaService.obtenerEducaciones();
  }

  @Get('estados_civiles')
  obtenerEstadosCiviles(): Promise<EstadoCivil[]> {
    return this.personaService.obtenerEstadosCiviles();
  }

  @Get('ocupaciones')
  obtenerOcupaciones(): Promise<Ocupacion[]> {
    return this.personaService.obtenerOcupaciones();
  }

  @Post('miembros')
  crearMiembro(
    @Body() dto: CrearMiembroDto,
  ): Promise<Miembro> {
    return this.personaService.crearMiembro(dto);
  }

  @Get('miembros')
  filtrarMiembros(
    @Query()
    options: {
      id?: number;
      cedula?: string;
      zona?: number;
      rol?: number;
      requisito?: number;
      competencia?: number;
    },
  ): Promise<Miembro[]> {
    return this.personaService.obtenerMiembros(options);
  }

  @Get('estadisticas')
  async obtenerConteo(
    @Query() options: { requisito?: number; competencia?: number; zona?: number; },
    @Res() res: Response,
  ) {
    const miembros = await this.personaService.obtenerEstadisticas({ zona: options.zona });
    const estadistica = await this.personaService.obtenerEstadisticas(options);

    return res.json({ total_miembros: miembros, cantidad: estadistica });
  }
}

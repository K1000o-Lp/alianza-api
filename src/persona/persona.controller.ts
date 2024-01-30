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
  async obtenerDiscapacidades(): Promise<Discapacidad[]> {
    return await this.personaService.obtenerDiscapacidades();
  }

  @Get('educaciones')
  async obtenerEducaciones(): Promise<Educacion[]> {
    return await this.personaService.obtenerEducaciones();
  }

  @Get('estados_civiles')
  async obtenerEstadosCiviles(): Promise<EstadoCivil[]> {
    return await this.personaService.obtenerEstadosCiviles();
  }

  @Get('ocupaciones')
  async obtenerOcupaciones(): Promise<Ocupacion[]> {
    return await this.personaService.obtenerOcupaciones();
  }

  @Post('miembros')
  async crearMiembro(
    @Body() crearMiembroDto: CrearMiembroDto,
  ): Promise<Miembro> {
    const miembro = await this.personaService.crearMiembro(crearMiembroDto);

    return miembro;
  }

  @Get('miembros')
  async filtrarMiembros(
    @Query()
    options: {
      cedula?: string;
      zona?: number;
      rol?: number;
      requisito?: number;
      competencia?: number;
    },
  ): Promise<Miembro[]> {
    return await this.personaService.obtenerMiembros(options);
  }

  @Get('estadisticas')
  async obtenerConteo(
    @Query() options: { requisito?: number; competencia?: number },
    @Res() res: Response,
  ) {
    const miembros = await this.personaService.obtenerEstadisticas({});
    const estadistica = await this.personaService.obtenerEstadisticas(options);

    return res.json({ total_miembros: miembros, cantidad: estadistica });
  }
}

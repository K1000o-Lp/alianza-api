import { Body, Controller, Get, Injectable, Param, Post, Put, Query, Res } from '@nestjs/common';
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
import { OrganizacionService } from 'src/organizacion/organizacion.service';

@Controller('persona')
export class PersonaController {
  constructor(private personaService: PersonaService, private organizacionService: OrganizacionService) {}

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

  @Put('miembros/:id')
  actualizarMiembro(
    @Param('id') id: string,
    @Body() dto: CrearMiembroDto,
  ): Promise<Miembro> {
    return this.personaService.actualizarMiembro(dto, Number(id));
  }

  @Get('miembros')
  filtrarMiembros(
    @Query()
    options: {
      id?: number;  
      cedula?: string;
      zona?: number;
      supervisor?: number;
      rol?: number;
      no_completado?: string;
      requisito?: number;
      competencia?: number;
      results_since?: Date;
      results_until?: Date;
      limite?: number;
      desplazamiento?: number;
      q?: string
    },
  ): Promise<Miembro[]> {
    return this.personaService.obtenerMiembros(options);
  }

  @Get('miembros/reportes')
  async obtenerInsights(
    @Query()
    options: {
      zona?: number;
      rol?: number;
      no_completado?: string;
      requisito?: number;
      competencia?: number;
      results_since?: Date;
      results_until?: Date;
    },
    @Res() res: Response,
  ) {
    let buffer = null;
    
    if(options.zona == 0 || !options.zona) {
      buffer = await this.personaService.obtenerReportesExcelTodas(options);
    } else if(options.zona) {
      buffer = await this.personaService.obtenerReportesExcelZona(options);
    }

    res.set('Content-Disposition', 'attachment; filename="reporte_consolidacion.xlsx"');
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);
  }

  @Get('estadisticas/reportes')
  async obtenerEstadisticasExcel(
    @Query() options: {
      zona?: number;
    },
    @Res() res: Response
  ) {
    let buffer = null;

    if(options.zona == 0) {
      buffer = await this.personaService.obtenerEstadisticasExcel();
    } else {
      buffer = await this.personaService.obtenerEstadisticasZonaExcel({ zona: options.zona });
    }

    res.set('Content-Disposition', 'attachment; filename="reporte_estadisticas.xlsx"');
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);
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

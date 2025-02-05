import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';
import { crearZonaSupervisorDto } from './dtos/crear-zona-supervisor.dto';

@Controller('organizacion')
export class OrganizacionController {
  constructor(private organizacionService: OrganizacionService) {}

  @Get('zonas')
  obtenerZonas() {
    return this.organizacionService.obtenerZonas();
  }

  @Get('servicios')
  obtenerServicios() {
    return this.organizacionService.obtenerServicios();
  }

  @Get('supervisores')
  obtenerSupervisores(
    @Query()
    options: {
      zona_id?: number;
    }
  ) {
    return this.organizacionService.obtenerSupervisores(options);
  }

  @Get('supervisores/:id')
  ObtenerSupervisor(
    @Param('id') id: string
  ) {
    return this.organizacionService.obtenerSupervisor(Number(id));
  }

  @Post('supervisores')
  crearSupervisor(
    @Body() dto: crearZonaSupervisorDto
  )
  {
    return this.organizacionService.crearSupervisor(dto);
  }

  @Delete('supervisores/:id')
  eliminarSupervisor(
    @Param('id') id: string
  ) {
    return this.organizacionService.eliminarSupervisor(Number(id));
  }
}

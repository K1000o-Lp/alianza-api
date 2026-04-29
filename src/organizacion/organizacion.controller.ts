import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';
import { crearZonaSupervisorDto } from './dtos/crear-zona-supervisor.dto';
import { EstadoSolicitud } from './entities';

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

  // ─── Solicitudes de transferencia ────────────────────────────────────────

  @Post('solicitudes-transferencia')
  crearSolicitud(
    @Body() dto: {
      miembro_id: number;
      zona_origen_id: number;
      zona_destino_id: number;
      solicitante_id?: number;
    },
  ) {
    return this.organizacionService.crearSolicitudTransferencia(dto);
  }

  @Get('solicitudes-transferencia')
  obtenerSolicitudes(
    @Query() options: {
      zona_origen_id?: number;
      zona_destino_id?: number;
      estado?: EstadoSolicitud;
    },
  ) {
    return this.organizacionService.obtenerSolicitudesTransferencia(options);
  }

  @Put('solicitudes-transferencia/:id/aprobar')
  aprobarSolicitud(
    @Param('id') id: string,
    @Body() dto: { aprobador_id: number },
  ) {
    return this.organizacionService.aprobarSolicitudTransferencia(Number(id), dto.aprobador_id);
  }

  @Put('solicitudes-transferencia/:id/rechazar')
  rechazarSolicitud(
    @Param('id') id: string,
    @Body() dto: { aprobador_id: number },
  ) {
    return this.organizacionService.rechazarSolicitudTransferencia(Number(id), dto.aprobador_id);
  }
}

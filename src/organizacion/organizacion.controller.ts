import { Controller, Get } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';

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
}

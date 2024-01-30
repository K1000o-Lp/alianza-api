import { Controller, Get } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';

@Controller('organizacion')
export class OrganizacionController {
  constructor(private organizacionService: OrganizacionService) {}

  @Get('zonas')
  async obtenerZonas() {
    return await this.organizacionService.obtenerZonas();
  }

  @Get('servicios')
  async obtenerServicios() {
    return await this.organizacionService.obtenerServicios();
  }
}

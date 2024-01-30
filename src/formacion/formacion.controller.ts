import { Controller, Get } from '@nestjs/common';
import { FormacionService } from './formacion.service';

@Controller('formacion')
export class FormacionController {
  constructor(private formacionService: FormacionService) {}

  @Get('formaciones')
  async obtenerFormaciones() {
    return await this.formacionService.obtenerFormaciones();
  }

  @Get('requisitos')
  async obtenerRequisitos() {
    return await this.formacionService.obtenerRequisitos();
  }

  @Get('competencias')
  async obtenerCompetencias() {
    return await this.formacionService.obtenerCompetencias();
  }
}

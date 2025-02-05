import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizacionController } from './organizacion.controller';
import { OrganizacionService } from './organizacion.service';
import { HistorialMiembro, Servicio, Zona, ZonaSupervisor } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Zona, Servicio, HistorialMiembro, ZonaSupervisor])],
  controllers: [OrganizacionController],
  providers: [OrganizacionService],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}

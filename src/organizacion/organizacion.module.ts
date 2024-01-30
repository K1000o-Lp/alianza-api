import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizacionController } from './organizacion.controller';
import { OrganizacionService } from './organizacion.service';
import { HistorialMiembro, Servicio, Zona } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Zona, Servicio, HistorialMiembro])],
  controllers: [OrganizacionController],
  providers: [OrganizacionService],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}

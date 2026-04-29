import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizacionController } from './organizacion.controller';
import { OrganizacionService } from './organizacion.service';
import { HistorialMiembro, Servicio, Zona, ZonaSupervisor, SolicitudTransferencia } from './entities';
import { Miembro } from 'src/persona/entities';
import { Usuario } from 'src/usuarios/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Zona, Servicio, HistorialMiembro, ZonaSupervisor, SolicitudTransferencia, Miembro, Usuario])],
  controllers: [OrganizacionController],
  providers: [OrganizacionService],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}

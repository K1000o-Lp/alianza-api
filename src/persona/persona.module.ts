import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { PersonaService } from './persona.service';
import { PersonaController } from './persona.controller';
import { FormacionModule } from 'src/formacion/formacion.module';
import { OrganizacionModule } from 'src/organizacion/organizacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstadoCivil,
      Ocupacion,
      Discapacidad,
      Educacion,
      Miembro,
    ]),
    FormacionModule,
    OrganizacionModule,
  ],
  controllers: [PersonaController],
  providers: [PersonaService],
  exports: [PersonaService],
})
export class PersonaModule {}

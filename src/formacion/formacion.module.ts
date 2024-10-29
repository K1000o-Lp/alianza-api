import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formacion, Requisito, Asistencia, Evento, Resultado } from './entities';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';
import { PersonaModule } from 'src/persona/persona.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Formacion,
      Requisito,
      Resultado,
      Asistencia,
      Evento,
    ]),
  ],
  controllers: [FormacionController],
  providers: [FormacionService],
  exports: [FormacionService],
})
export class FormacionModule {}

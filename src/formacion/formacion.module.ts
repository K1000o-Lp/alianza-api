import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competencia, Formacion, Requisito } from './entities';
import { Evaluacion } from './entities/evaluacion.entity';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';
import { Asistencia } from './entities/asistencia.entity';
import { Evento } from './entities/evento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Formacion,
      Requisito,
      Competencia,
      Evaluacion,
      Asistencia,
      Evento,
    ]),
  ],
  controllers: [FormacionController],
  providers: [FormacionService],
  exports: [FormacionService],
})
export class FormacionModule {}

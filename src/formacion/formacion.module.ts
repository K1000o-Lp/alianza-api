import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formacion, Requisito, Evaluacion, Asistencia, Evento } from './entities';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Formacion,
      Requisito,
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

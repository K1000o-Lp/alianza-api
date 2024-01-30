import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competencia, Formacion, Requisito } from './entities';
import { Evaluacion } from './entities/evaluacion.entity';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Formacion, Requisito, Competencia, Evaluacion]),
  ],
  controllers: [FormacionController],
  providers: [FormacionService],
  exports: [FormacionService],
})
export class FormacionModule {}

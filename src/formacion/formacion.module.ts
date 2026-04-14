import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formacion, Requisito, Asistencia, Evento, Resultado } from './entities';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';
import { PersonaModule } from 'src/persona/persona.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

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
  providers: [FormacionService, JwtAuthGuard, RolesGuard],
  exports: [FormacionService],
})
export class FormacionModule {}

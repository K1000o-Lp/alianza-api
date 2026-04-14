import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario, Rol } from './entities';
import { Miembro } from 'src/persona/entities';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, Miembro]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, JwtAuthGuard, RolesGuard],
  exports: [UsuariosService],
})
export class UsuariosModule {}

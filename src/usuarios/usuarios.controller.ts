import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { actualizarRolDto, crearUsuarioDto, resetContrasenaDto } from './dtos';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listarUsuarios() {
    return this.usuariosService.findAll();
  }

  @Post()
  crearUsuario(@Body() dto: crearUsuarioDto) {
    return this.usuariosService.crearUsuario(dto);
  }

  @Get('roles')
  listarRoles() {
    return this.usuariosService.obtenerRoles();
  }

  @Put(':id/rol')
  actualizarRol(
    @Param('id') id: string,
    @Body() dto: actualizarRolDto,
  ) {
    return this.usuariosService.actualizarRol(Number(id), dto.rol_id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  eliminarUsuario(@Param('id') id: string) {
    return this.usuariosService.eliminarUsuario(Number(id));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/contrasena')
  resetContrasena(
    @Param('id') id: string,
    @Body() dto: resetContrasenaDto,
  ) {
    return this.usuariosService.resetContrasena(Number(id), dto.nueva_contrasena);
  }
}

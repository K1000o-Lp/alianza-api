import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { iniciarSesionDto } from './dtos';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService 
  ) {}

  async iniciarSesion(dto: iniciarSesionDto): Promise<AccessTokenDto> {
    const usuario = await this.usuariosService.findOne(dto.nombre_usuario.toLocaleLowerCase());

    if(usuario?.contrasena !== dto.contrasena) {
      throw new UnauthorizedException();
    }

    const { contrasena, ...session } = usuario;

    const payload = { session };

    return {
      access_token: await this.jwtService.signAsync(payload)
    }
  }
}

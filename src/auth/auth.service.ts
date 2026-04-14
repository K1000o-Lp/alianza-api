import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { iniciarSesionDto } from './dtos';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import * as bcrypt from 'bcrypt';
import { registrarUsuarioDto } from './dtos/registrar-usuario.dto';
import { registroCompletoDto } from './dtos/registro-completo.dto';
import { PersonaService } from 'src/persona/persona.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private personaService: PersonaService,
    private jwtService: JwtService,
  ) {}

  async iniciarSesion(dto: iniciarSesionDto): Promise<{ access_token: string; refresh_token: string }> {
    const usuario = await this.usuariosService.findOne(dto.nombre_usuario.toLocaleLowerCase());

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(dto.contrasena, usuario.contrasena);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { contrasena, refresh_token, refresh_token_expira_en, ...session } = usuario;

    const [access_token, refresh_token_nuevo] = await Promise.all([
      this.jwtService.signAsync({ session }),
      this.jwtService.signAsync(
        { sub: usuario.id },
        { secret: jwtConstants.refreshSecret, expiresIn: jwtConstants.refreshExpiresIn },
      ),
    ]);

    const refreshHash = await bcrypt.hash(refresh_token_nuevo, SALT_ROUNDS);
    const expiry = new Date(Date.now() + jwtConstants.refreshExpiresInMs);
    await this.usuariosService.updateRefreshToken(usuario.id, refreshHash, expiry);

    return { access_token, refresh_token: refresh_token_nuevo };
  }

  async refrescarToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    let payload: { sub: number };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtConstants.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usuariosService.findById(payload.sub);

    if (!usuario?.refresh_token || !usuario.refresh_token_expira_en) {
      throw new UnauthorizedException('Sesión no encontrada');
    }

    if (new Date() > usuario.refresh_token_expira_en) {
      throw new UnauthorizedException('Sesión expirada');
    }

    const isValid = await bcrypt.compare(refreshToken, usuario.refresh_token);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const { contrasena, refresh_token: _rt, refresh_token_expira_en: _exp, ...session } = usuario;

    const [access_token, refresh_token_nuevo] = await Promise.all([
      this.jwtService.signAsync({ session }),
      this.jwtService.signAsync(
        { sub: usuario.id },
        { secret: jwtConstants.refreshSecret, expiresIn: jwtConstants.refreshExpiresIn },
      ),
    ]);

    const refreshHash = await bcrypt.hash(refresh_token_nuevo, SALT_ROUNDS);
    const expiry = new Date(Date.now() + jwtConstants.refreshExpiresInMs);
    await this.usuariosService.updateRefreshToken(usuario.id, refreshHash, expiry);

    return { access_token, refresh_token: refresh_token_nuevo };
  }

  async cerrarSesion(usuarioId: number): Promise<void> {
    await this.usuariosService.updateRefreshToken(usuarioId, null, null);
  }

  async registrarUsuario(dto: registrarUsuarioDto): Promise<{ access_token: string; refresh_token: string }> {
    const miembro = await this.usuariosService.findMiembroForRegistro(dto.cedula, dto.nombre_completo);

    if (!miembro) {
      throw new HttpException('Miembro no encontrado. Verifica tu cédula o nombre.', HttpStatus.NOT_FOUND);
    }

    const usuarioExistente = await this.usuariosService.findByMiembro(miembro.id);
    if (usuarioExistente) {
      throw new HttpException('Este miembro ya tiene un usuario registrado', HttpStatus.CONFLICT);
    }

    const usernameOcupado = await this.usuariosService.findOne(dto.nombre_usuario.toLowerCase());
    if (usernameOcupado) {
      throw new HttpException('El nombre de usuario ya está en uso', HttpStatus.CONFLICT);
    }

    const usuario = await this.usuariosService.crearUsuario({
      nombre_usuario: dto.nombre_usuario.toLowerCase(),
      contrasena: dto.contrasena,
      rol_nombre: 'miembros',
      miembro_id: miembro.id,
      zona_id: dto.zona_id,
    });

    const { contrasena, refresh_token: _rt, refresh_token_expira_en: _exp, ...session } = usuario;

    const [access_token, refresh_token_nuevo] = await Promise.all([
      this.jwtService.signAsync({ session }),
      this.jwtService.signAsync(
        { sub: usuario.id },
        { secret: jwtConstants.refreshSecret, expiresIn: jwtConstants.refreshExpiresIn },
      ),
    ]);

    const refreshHash = await bcrypt.hash(refresh_token_nuevo, SALT_ROUNDS);
    const expiry = new Date(Date.now() + jwtConstants.refreshExpiresInMs);
    await this.usuariosService.updateRefreshToken(usuario.id, refreshHash, expiry);

    return { access_token, refresh_token: refresh_token_nuevo };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async registrarCompleto(dto: registroCompletoDto): Promise<{ access_token: string; refresh_token: string }> {
    const usernameOcupado = await this.usuariosService.findOne(dto.nombre_usuario.toLowerCase());
    if (usernameOcupado) {
      throw new HttpException('El nombre de usuario ya está en uso', HttpStatus.CONFLICT);
    }

    let miembroId: number;

    if (dto.transferir) {
      const miembroExistente = await this.personaService.obtenerMiembroExistentePorIdentificacion(
        dto.cedula,
        dto.nombre_completo.toUpperCase(),
      );
      if (!miembroExistente) {
        throw new HttpException('Miembro no encontrado para transferir', HttpStatus.NOT_FOUND);
      }
      await this.personaService.transferirZona(miembroExistente.id, dto.zona_id);
      miembroId = miembroExistente.id;
    } else {
      const miembro = await this.personaService.crearMiembro({
        nombre_completo: dto.nombre_completo.toUpperCase(),
        cedula: dto.cedula,
        telefono: dto.telefono,
        fecha_nacimiento: dto.fecha_nacimiento,
        historial: { zona_id: dto.zona_id },
      });
      miembroId = miembro.id;
    }

    const usuario = await this.usuariosService.crearUsuario({
      nombre_usuario: dto.nombre_usuario.toLowerCase(),
      contrasena: dto.contrasena,
      rol_nombre: 'miembros',
      miembro_id: miembroId,
    });

    const { contrasena, refresh_token: _rt, refresh_token_expira_en: _exp, ...session } = usuario;

    const [access_token, refresh_token_nuevo] = await Promise.all([
      this.jwtService.signAsync({ session }),
      this.jwtService.signAsync(
        { sub: usuario.id },
        { secret: jwtConstants.refreshSecret, expiresIn: jwtConstants.refreshExpiresIn },
      ),
    ]);

    const refreshHash = await bcrypt.hash(refresh_token_nuevo, SALT_ROUNDS);
    const expiry = new Date(Date.now() + jwtConstants.refreshExpiresInMs);
    await this.usuariosService.updateRefreshToken(usuario.id, refreshHash, expiry);

    return { access_token, refresh_token: refresh_token_nuevo };
  }
}

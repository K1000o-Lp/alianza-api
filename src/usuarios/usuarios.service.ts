import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Usuario } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { crearUsuarioDto } from './dtos';
import { Miembro } from 'src/persona/entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol) private rolRepository: Repository<Rol>,
    @InjectRepository(Miembro) private miembroRepository: Repository<Miembro>,
  ) {}

  async findOne(nombre_usuario: string): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      relations: { miembro: true, zona: true, rol: true },
      where: { nombre_usuario },
    });
  }

  async findById(id: number): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      relations: { miembro: true, zona: true, rol: true },
      where: { id },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      relations: { miembro: true, zona: true, rol: true },
      select: {
        id: true,
        nombre_usuario: true,
        refresh_token: false,
        refresh_token_expira_en: false,
        contrasena: false,
      },
    });
  }

  async findByMiembro(miembro_id: number): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      where: { miembro: { id: miembro_id } },
    });
  }

  async findMiembroForRegistro(cedula?: string, nombre_completo?: string): Promise<Miembro | undefined> {
    if (!cedula && !nombre_completo) return undefined;

    if (cedula) {
      return await this.miembroRepository.findOne({ where: { cedula } });
    }

    return await this.miembroRepository.findOne({ where: { nombre_completo } });
  }

  async crearUsuario(dto: crearUsuarioDto): Promise<Usuario> {
    const rol = await this.rolRepository.findOne({ where: { nombre: dto.rol_nombre } });

    if (!rol) {
      throw new HttpException(`Rol '${dto.rol_nombre}' no encontrado`, HttpStatus.NOT_FOUND);
    }

    const existe = await this.usuarioRepository.findOne({ where: { nombre_usuario: dto.nombre_usuario } });
    if (existe) {
      throw new HttpException('El nombre de usuario ya está en uso', HttpStatus.CONFLICT);
    }

    const hash = await bcrypt.hash(dto.contrasena, 10);

    const usuario = this.usuarioRepository.create({
      nombre_usuario: dto.nombre_usuario,
      contrasena: hash,
      rol,
      ...(dto.miembro_id ? { miembro: { id: dto.miembro_id } } : {}),
      ...(dto.zona_id ? { zona: { id: dto.zona_id } } : {}),
    });

    return await this.usuarioRepository.save(usuario);
  }

  async actualizarRol(id: number, rol_id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id }, relations: { rol: true } });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    usuario.rol = { id: rol_id } as Rol;
    return await this.usuarioRepository.save(usuario);
  }

  async eliminarUsuario(id: number): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.usuarioRepository.remove(usuario);
  }

  async updateRefreshToken(
    id: number,
    refreshToken: string | null,
    expiry: Date | null,
  ): Promise<void> {
    await this.usuarioRepository.update(id, {
      refresh_token: refreshToken,
      refresh_token_expira_en: expiry,
    });
  }

  async obtenerRoles(): Promise<Rol[]> {
    return await this.rolRepository.find();
  }

  async resetContrasena(id: number, nuevaContrasena: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await this.usuarioRepository.update(id, {
      contrasena: hash,
      refresh_token: null,
      refresh_token_expira_en: null,
    });
  }
}

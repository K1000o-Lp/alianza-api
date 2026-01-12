import { Injectable } from '@nestjs/common';
import { Usuario } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectRepository(Usuario) private usuarioRepository: Repository<Usuario>,
  ) {}

  async findOne(nombre_usuario: string): Promise<Usuario | undefined> {
    return await this.usuarioRepository.findOne({
      relations: {
        miembro: true,
        zona: true,
      },
      where: {
        nombre_usuario
      },
    })
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  Asistencia,
  Evento,
  Formacion,
  Requisito,
  Resultado,
} from './entities';
import {
  crearAsistenciaDto,
  crearEventoDto,
  crearResultadoDto,
} from './dtos';
import { crearAsistenciasDto } from './dtos/crear-asistencias.dto';
import { Miembro } from 'src/persona/entities';

@Injectable()
export class FormacionService {
  constructor(
    @InjectRepository(Formacion)
    private formacionRepository: Repository<Formacion>,
    @InjectRepository(Requisito)
    private requisitoRepository: Repository<Requisito>,
    @InjectRepository(Resultado)
    private resultadoRepository: Repository<Resultado>,
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
    private dataSource: DataSource
  ) {}

  async obtenerFormaciones(): Promise<Formacion[]> {
    return await this.formacionRepository.find();
  }

  async obtenerRequisitos(options: {
    requisitos?: string;
  }): Promise<Requisito[]> {
    const queryBuilder = this.requisitoRepository.createQueryBuilder('requisito');

    if(options.requisitos) {
      const requisitos = options.requisitos.split(',').map(requisito => Number(requisito));
      queryBuilder.where('requisito.id NOT IN (:...requisitos)', { requisitos });
    }

    return await queryBuilder.getMany();
  }

  async obtenerEvento(options: { zona?: number }): Promise<Evento[]> {
    return await this.eventoRepository.find({
      where: { zona: { id: options?.zona } },
    });
  }

  async obtenerAsistencias(options: { evento: number }): Promise<Asistencia[]> {
    return await this.asistenciaRepository.find({
      where: {
        evento: {
          id: options.evento,
        },
      },
      order: {
        creado_en: 'DESC',
      },
    });
  }

  async crearEvento(dto: crearEventoDto): Promise<Evento> {
    const { zona_id, nombre, descripcion } = dto;

    const evento = this.eventoRepository.create({
      nombre,
      descripcion,
      zona: { id: zona_id },
    });

    await this.eventoRepository.save(evento);

    return evento;
  }

  async crearAsistencia(
    crearAsistenciaDto: crearAsistenciaDto,
  ): Promise<Asistencia> {
    const { evento_id, miembro_id } = crearAsistenciaDto;

    const asistencia = this.asistenciaRepository.create({
      evento: {
        id: evento_id,
      },
      miembro: {
        id: miembro_id,
      },
    });

    await this.asistenciaRepository.save(asistencia);

    return asistencia;
  }

  async crearAsistencias(
    crearAsistenciasDto: crearAsistenciasDto,
  ): Promise<Asistencia[]> {

    const { evento_id, miembros } = crearAsistenciasDto;

    const asistencias = await Promise.all(
      miembros?.map(async ({ miembro_id }) => {
        const asistencia = this.asistenciaRepository.create({
          evento: {
            id: evento_id,
          },
          miembro: {
            id: miembro_id,
          }
        })

        await this.asistenciaRepository.save(asistencia);

        return asistencia;
      })
    );

    return asistencias;
  }

  async crearResultado(dto: crearResultadoDto): Promise<Resultado[] | null> {
    const requisitos = await this.requisitoRepository.find({ where: { id: In(dto.requisito_ids) } });

    if(requisitos.length !== dto.requisito_ids.length) {
      throw new HttpException('Requisito no encontrado', HttpStatus.NOT_FOUND);
    }

    let resultados: Resultado[] = [];

    requisitos.forEach(requisito => {
      resultados.push(this.resultadoRepository.create({
          miembro: { id: dto.miembro_id },
          requisito,
          creado_en: dto.fecha_consolidacion
      }));
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      resultados.forEach(async resultado => {
        await queryRunner.manager.save(resultado);
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(err.detail, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    return resultados;
  }

  async eliminarResultado(id: string): Promise<Object> {
    const parsedId: number = parseInt(id);

    const resultado = await this.resultadoRepository.findOne({ where: { id: parsedId } });

    if(!resultado) {
      throw new HttpException('Resultado no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.resultadoRepository.remove(resultado);

    return { mensaje: 'Resultado eliminado' };
  }
}

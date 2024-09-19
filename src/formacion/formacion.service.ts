import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Asistencia,
  Evaluacion,
  Evento,
  Formacion,
  Requisito,
} from './entities';
import {
  actualizarEvaluacionDto,
  crearAsistenciaDto,
  crearEventoDto,
} from './dtos';
import { crearAsistenciasDto } from './dtos/crear-asistencias-dto';

@Injectable()
export class FormacionService {
  constructor(
    @InjectRepository(Formacion)
    private formacionRepository: Repository<Formacion>,
    @InjectRepository(Requisito)
    private requisitoRepository: Repository<Requisito>,
    @InjectRepository(Evaluacion)
    private evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
    private dataSource: DataSource
  ) {}

  async obtenerFormaciones(): Promise<Formacion[]> {
    return await this.formacionRepository.find();
  }

  async obtenerRequisitos(): Promise<Requisito[]> {
    return await this.requisitoRepository.find();
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

  async crearEvento(crearEventoDto: crearEventoDto): Promise<Evento> {
    const { zona_id, nombre, descripcion } = crearEventoDto;

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

  async crearEvaluacionesPorDefecto(): Promise<Evaluacion[] | null> {
    const requisitos = await this.obtenerRequisitos();

    const evaluaciones = this.evaluacionRepository.create(
      requisitos.map((requisito) => {
        return {
          requisito: requisito,
          resultado: false,
        };
      }),
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(evaluaciones);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return null;
    } finally {
      await queryRunner.release();
    }

    return evaluaciones;
  }

  async actualizarEvaluaciones(
    evaluaciones: actualizarEvaluacionDto[],
  ): Promise<Evaluacion[]> {
    if (!Array.isArray(evaluaciones)) {
      throw new TypeError();
    }

    const evaluacionesActualizadas = await Promise.all(
      evaluaciones.map(async (evaluacion: actualizarEvaluacionDto) => {
        await this.evaluacionRepository.update(
          {
            id: evaluacion.id,
          },
          { resultado: evaluacion.resultado },
        );

        const evaluacionActualizada = await this.evaluacionRepository.findOne({
          relations: {
            requisito: true,
          },
          where: {
            id: evaluacion.id,
          },
        });

        return evaluacionActualizada;
      }),
    );

    return evaluacionesActualizadas;
  }
}

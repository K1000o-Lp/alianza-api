import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Asistencia,
  Competencia,
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

@Injectable()
export class FormacionService {
  constructor(
    @InjectRepository(Formacion)
    private formacionRepository: Repository<Formacion>,
    @InjectRepository(Requisito)
    private requisitoRepository: Repository<Requisito>,
    @InjectRepository(Competencia)
    private competenciaRepository: Repository<Competencia>,
    @InjectRepository(Evaluacion)
    private evaluacionRepository: Repository<Evaluacion>,
    @InjectRepository(Evento)
    private eventoRepository: Repository<Evento>,
    @InjectRepository(Asistencia)
    private asistenciaRepository: Repository<Asistencia>,
  ) {}

  async obtenerFormaciones(): Promise<Formacion[]> {
    return await this.formacionRepository.find();
  }

  async obtenerRequisitos(): Promise<Requisito[]> {
    return await this.requisitoRepository.find();
  }

  async obtenerCompetencias(): Promise<Competencia[]> {
    return await this.competenciaRepository.find();
  }

  async obtenerCompetencia(term: number): Promise<Competencia | null> {
    return await this.competenciaRepository.findOne({
      where: { competencia_id: term },
    });
  }

  async obtenerEvento(options: { zona?: number }): Promise<Evento[]> {
    return await this.eventoRepository.find({
      where: { zona: { zona_id: options?.zona } },
    });
  }

  async obtenerAsistencias(options: { evento: number }): Promise<Asistencia[]> {
    return await this.asistenciaRepository.find({
      where: {
        evento: {
          evento_id: options.evento,
        },
      },
      order: {
        creado_en: 'DESC',
      },
    });
  }

  async crearEvento(crearEventoDto: crearEventoDto): Promise<Evento> {
    const { zona_fk_id, nombre, descripcion } = crearEventoDto;

    const evento = this.eventoRepository.create({
      nombre,
      descripcion,
      zona: { zona_id: zona_fk_id },
    });

    await this.requisitoRepository.save(evento);

    return evento;
  }

  async crearAsistencia(
    crearAsistenciaDto: crearAsistenciaDto,
  ): Promise<Asistencia> {
    const { evento_fk_id, miembro_fk_id } = crearAsistenciaDto;

    const asistencia = this.asistenciaRepository.create({
      evento: {
        evento_id: evento_fk_id,
      },
      miembro: {
        miembro_id: miembro_fk_id,
      },
    });

    await this.asistenciaRepository.save(asistencia);

    return asistencia;
  }

  async crearEvaluacionesPorDefecto(): Promise<Evaluacion[] | null> {
    const NO = 1;
    const requisitos = await this.obtenerRequisitos();
    const competencia = await this.obtenerCompetencia(NO);

    const evaluaciones = this.evaluacionRepository.create(
      requisitos.map((requisito) => {
        return {
          requisito: requisito,
          competencia: competencia,
        };
      }),
    );

    /*const evaluaciones = requisitos.map((requisito) => {
      const evaluacion = new Evaluacion();
      evaluacion.requisito = requisito;
      evaluacion.competencia = competencia;

      return evaluacion;
    });*/

    await this.evaluacionRepository.save(evaluaciones);

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
            evaluacion_id: evaluacion.evaluacion_id,
          },
          { competencia: evaluacion.competencia },
        );

        const evaluacionActualizada = await this.evaluacionRepository.findOne({
          relations: {
            requisito: true,
            competencia: true,
          },
          where: {
            evaluacion_id: evaluacion.evaluacion_id,
          },
        });

        return evaluacionActualizada;
      }),
    );

    return evaluacionesActualizadas;
  }
}

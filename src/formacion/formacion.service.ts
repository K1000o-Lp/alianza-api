import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competencia, Evaluacion, Formacion, Requisito } from './entities';

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
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { Repository } from 'typeorm';
import { CrearMiembroDto } from './dtos/crear-miembro.dto';
import { FormacionService } from 'src/formacion/formacion.service';
import { OrganizacionService } from 'src/organizacion/organizacion.service';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Discapacidad)
    private discapacidadRepository: Repository<Discapacidad>,
    @InjectRepository(Educacion)
    private educacionRespository: Repository<Educacion>,
    @InjectRepository(EstadoCivil)
    private estadoCivilRepository: Repository<EstadoCivil>,
    @InjectRepository(Ocupacion)
    private ocupacionRepository: Repository<Ocupacion>,
    @InjectRepository(Miembro) private miembroRepository: Repository<Miembro>,
    private formacionService: FormacionService,
    private organizacionService: OrganizacionService,
  ) {}

  async obtenerDiscapacidades(): Promise<Discapacidad[]> {
    return await this.discapacidadRepository.find();
  }

  async obtenerDiscapacidad(term: number): Promise<Discapacidad> {
    return await this.discapacidadRepository.findOne({
      where: { discapacidad_id: term },
    });
  }

  async obtenerEducaciones(): Promise<Educacion[]> {
    return await this.educacionRespository.find();
  }

  async obtenerEducacion(term: number): Promise<Educacion> {
    return await this.educacionRespository.findOne({
      where: { educacion_id: term },
    });
  }

  async obtenerEstadosCiviles(): Promise<EstadoCivil[]> {
    return await this.estadoCivilRepository.find();
  }

  async obtenerEstadoCivil(term: number): Promise<EstadoCivil> {
    return await this.estadoCivilRepository.findOne({
      where: { estado_civil_id: term },
    });
  }

  async obtenerOcupaciones(): Promise<Ocupacion[]> {
    return await this.ocupacionRepository.find();
  }

  async obtenerOcupacion(term: number): Promise<Ocupacion> {
    return await this.ocupacionRepository.findOne({
      where: { ocupacion_id: term },
    });
  }

  async crearMiembro(crearMiembroDto: CrearMiembroDto): Promise<Miembro> {
    const { historial, ...data } = crearMiembroDto;

    const evaluaciones =
      await this.formacionService.crearEvaluacionesPorDefecto();

    const historialMiembro =
      await this.organizacionService.crearHistorialMiembro(historial);

    const miembro = this.miembroRepository.create({
      cedula: data.cedula,
      nombre_completo: data.nombre_completo,
      telefono: data.telefono,
      fecha_nacimiento: data.fecha_nacimiento,
      hijos: data.hijos,
      evaluaciones: evaluaciones,
      historiales: [historialMiembro],
    });

    await this.miembroRepository.save(miembro);

    return miembro;
  }

  async obtenerMiembros(options: {
    cedula?: string;
    zona?: number;
    rol?: number;
    requisito?: number;
    competencia?: number;
  }): Promise<Miembro[]> {
    const miembros = await this.miembroRepository.find({
      relations: {
        historiales: {
          servicio: true,
          lider: true,
        },
        evaluaciones: {
          requisito: true,
          competencia: true,
        },
      },
      where: {
        cedula: options?.cedula,
        evaluaciones: {
          requisito: {
            requisito_id: options?.requisito,
          },
          competencia: {
            competencia_id: options?.competencia,
          },
        },
        historiales: {
          servicio: {
            servicio_id: options?.rol,
          },
          zona: {
            zona_id: options?.zona,
          },
        },
      },
    });

    return miembros;
  }

  async obtenerEstadisticas(options: {
    requisito?: number;
    competencia?: number;
  }) {
    return await this.miembroRepository.count({
      relations: {
        evaluaciones: {
          requisito: true,
          competencia: true,
        },
      },
      where: {
        evaluaciones: {
          requisito: {
            requisito_id: options.requisito,
          },
          competencia: {
            competencia_id: options.competencia,
          },
        },
      },
    });
  }
}

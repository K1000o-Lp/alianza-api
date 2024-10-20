import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { DataSource, Repository, Transaction, getManager } from 'typeorm';
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
    private dataSource: DataSource
  ) {}

  async obtenerDiscapacidades(): Promise<Discapacidad[]> {
    return await this.discapacidadRepository.find();
  }

  async obtenerDiscapacidad(term: number): Promise<Discapacidad> {
    return await this.discapacidadRepository.findOne({
      where: { id: term },
    });
  }

  async obtenerEducaciones(): Promise<Educacion[]> {
    return await this.educacionRespository.find();
  }

  async obtenerEducacion(term: number): Promise<Educacion> {
    return await this.educacionRespository.findOne({
      where: { id: term },
    });
  }

  async obtenerEstadosCiviles(): Promise<EstadoCivil[]> {
    return await this.estadoCivilRepository.find();
  }

  async obtenerEstadoCivil(term: number): Promise<EstadoCivil> {
    return await this.estadoCivilRepository.findOne({
      where: { id: term },
    });
  }

  async obtenerOcupaciones(): Promise<Ocupacion[]> {
    return await this.ocupacionRepository.find();
  }

  async obtenerOcupacion(term: number): Promise<Ocupacion> {
    return await this.ocupacionRepository.findOne({
      where: { id: term },
    });
  }

  async crearMiembro(dto: CrearMiembroDto): Promise<Miembro> {
    const { historial, ...data } = dto;

    const miembroExiste = await this.verificarSiMiembroExiste({ cedula: data.cedula, nombre_completo: data.nombre_completo });

    console.log(miembroExiste);

    if(miembroExiste) {
      throw new HttpException('Ya existe un miembro con la misma cedula o nombre completo', HttpStatus.BAD_REQUEST);
    }

    const evaluaciones =
      await this.formacionService.crearEvaluacionesPorDefecto();

    const historialMiembro =
      await this.organizacionService.crearHistorialMiembro(historial);

    const miembro = this.miembroRepository.create({
      cedula: data.cedula ? data.cedula : null,
      nombre_completo: data.nombre_completo,
      fecha_nacimiento: data.fecha_nacimiento? data.fecha_nacimiento : null,
      telefono: data.telefono ? data.telefono : null,
      hijos: data.hijos,
      estado_civil: {
        id: data.estado_civil_id ? data.estado_civil_id : null,
      },
      educacion: {
        id: data.educacion_id,
      },
      ocupacion: {
        id: data.ocupacion_id,
      },
      discapacidad: {
        id: data.discapacidad_id,
      },
      evaluaciones: evaluaciones,
      historiales:  [ historialMiembro ],
    });

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(miembro);
      await queryRunner.commitTransaction();
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al crear miembro. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    return miembro;
  }

  async actualizarMiembro(dto: Partial<CrearMiembroDto>, id: number): Promise<Miembro> {
    const { historial, ...data } = dto;

    const miembro = await this.miembroRepository.findOne({ 
      relations: {
        estado_civil: true,
        educacion: true,
        ocupacion: true,
        discapacidad: true,
        historiales: true,
      }, where: { id } });

    if(!miembro) {
      throw new HttpException('Miembro no encontrado', HttpStatus.NOT_FOUND);
    }

    const nuevoHistorialMiembro = await this.organizacionService.actualizarHistorialMiembro(historial, id);

    miembro.cedula = data.cedula ? data.cedula : miembro.cedula;
    miembro.nombre_completo = data.nombre_completo ? data.nombre_completo : miembro.nombre_completo;
    miembro.telefono = data.telefono ? data.telefono : miembro.telefono;
    miembro.fecha_nacimiento = data.fecha_nacimiento ? data.fecha_nacimiento : miembro.fecha_nacimiento;
    miembro.hijos = data.hijos ? data.hijos : miembro.hijos;
    miembro.educacion.id = data.educacion_id ? data.educacion_id : miembro.educacion.id;
    miembro.estado_civil.id = data.estado_civil_id ? data.estado_civil_id : miembro.estado_civil.id;
    miembro.ocupacion.id = data.ocupacion_id ? data.ocupacion_id : miembro.ocupacion.id;
    miembro.discapacidad.id = data.discapacidad_id ? data.discapacidad_id : miembro.discapacidad.id;
    
    if(nuevoHistorialMiembro) {
      miembro.historiales.push(nuevoHistorialMiembro);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(miembro);
      await queryRunner.commitTransaction();
    } catch(err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al actualizar miembro. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    }  finally {
      await queryRunner.release();
    }

    return miembro;
  }

  async obtenerMiembros(options: {
    id?: number;
    cedula?: string;
    zona?: number;
    rol?: number;
    requisito?: number;
    resultado?: boolean;
  }): Promise<Miembro[]> {
    const miembros = await this.miembroRepository.find({
      relations: {
        estado_civil: true,
        ocupacion: true,
        educacion: true,
        discapacidad: true,
        historiales: {
          servicio: true,
          zona: true, 
        },
        evaluaciones: {
          requisito: true,
        },
      },
      where: {
        id: options?.id,
        cedula: options?.cedula,
        evaluaciones: {
          requisito: {
            id: options?.requisito,
          },
          resultado: options?.resultado
        },
        historiales: {
          fecha_finalizacion: null,
          servicio: {
            id: options?.rol,
          },
          zona: {
            id: options?.zona,
          },
        },
      },
      order: {
        evaluaciones: {
          id: 'ASC',
        }
      }
    });

    return miembros;
  }

  async obtenerEstadisticas(options: {
    zona?: number;
    requisito?: number;
    resultado?: boolean;
  }) {
    return await this.miembroRepository.count({
      relations: {
        evaluaciones: {
          requisito: true,
        },
      },
      where: {
        historiales: {
          zona: {
            id: options.zona,
          }
        },
        evaluaciones: {
          requisito: {
            id: options.requisito,
          },
          resultado: options.resultado,
        },
      },
    });
  }

  async verificarSiMiembroExiste(options: {
    cedula: string;
    nombre_completo: string;
  }): Promise<boolean> {
    return await this.miembroRepository.existsBy([{ cedula: options.cedula }, { nombre_completo: options.nombre_completo }]);
  }
}

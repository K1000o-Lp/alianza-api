import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { Between, DataSource, In, Not, Repository } from 'typeorm';
import { CrearMiembroDto } from './dtos/crear-miembro.dto';
import { OrganizacionService } from 'src/organizacion/organizacion.service';
import { Workbook } from 'exceljs';
import { FormacionService } from 'src/formacion/formacion.service';

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
    private organizacionService: OrganizacionService,
    private formationService: FormacionService,
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
    return await this.educacionRespository.find({order: { id: 'ASC' }});
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
    const { historial, requisito, ...data } = dto;

    const miembroExiste = await this.verificarSiMiembroExiste({ cedula: data.cedula, nombre_completo: data.nombre_completo });

    if(miembroExiste) {
      throw new HttpException('Ya existe un miembro con la misma cedula o nombre completo', HttpStatus.BAD_REQUEST);
    }

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

    if(requisito.requisito_ids && requisito.requisito_ids?.length > 0) {
      const resultados = await this.formationService.crearResultado({
        miembro_id: miembro.id,
        requisito_ids: requisito.requisito_ids,
        fecha_consolidacion: new Date(),
      });

      miembro.resultados = resultados;
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
    no_completado?: string;
    requisito?: number;
    results_since?: Date;
    results_until?: Date;
  }): Promise<Miembro[]> {
    const requisitoOrder = options?.id ? 'ASC' : 'DESC';
    const noCompletado = options?.no_completado === 'true' ? true : false;
    const zona0 = Number(process.env.ZONA_0);

    const whereClause: any = {
      id: options?.id,
      cedula: options?.cedula,
      resultados: {
        requisito: {
          id: options?.requisito,
        },
      },
      historiales: {
        fecha_finalizacion: null,
        servicio: {
          id: options?.rol,
        },
        zona:{
          id: options?.zona == 1000 ? undefined : options?.zona
        }
      },
    };
    
    if (options?.zona != zona0) {
      whereClause.historiales.zona.id = options?.zona;
    }

    if (options?.zona == 1000) {
      whereClause.historiales.zona.id = Not(zona0);
    } 

    if(options?.results_since && options?.results_until) {
      whereClause.resultados.creado_en = Between(options?.results_since, options?.results_until);
    }

    if (options?.requisito && noCompletado) {
      delete whereClause.resultados.requisito.id;
      delete whereClause.resultados.creado_en;

      const membersWithRequirement = await this.miembroRepository
      .createQueryBuilder('miembro')
      .innerJoin('miembro.resultados', 'resultado')
      .innerJoin('resultado.requisito', 'requisito')
      .where('requisito.id = :requisitoId', { requisitoId: options?.requisito })
      .select('miembro.id')
      .getRawMany();

      whereClause.id = Not(In(
        membersWithRequirement.map(({ miembro_id }) => miembro_id)
      ));
    }

    // Para hacer bautismo (requisito 3) o encuentro (requisito 4) deben haber completado primeros pasos (requisito 2)
    // if((options?.requisito == 3 || options.requisito == 4) && noCompletado) {
    //   whereClause.resultados.requisito.id = 2;
    // }

    // Para hacer pos encuentro (requisito 5) deben haber hecho encuentro (requisito 4)
    if(options?.requisito == 5 && noCompletado) {
      whereClause.resultados.requisito.id = 4;
    }

    // Para hacer doctrinas 1 (requisito 6) deben haber hecho pos encuentro (requisito 5)
    if(options?.requisito == 6 && noCompletado) {
      whereClause.resultados.requisito.id = 5;
    }

    // Para hacer doctrinas 2 (requisito 7) deben haber hecho doctrinas 1 (requisito 6)
    if(options?.requisito == 7 && noCompletado) {
      whereClause.resultados.requisito.id = 6;
    }

    // Para hacer entt de liderazgo (requisito 8) deben haber hecho doctrinas 2 (requisito 7)
    if(options?.requisito == 8 && noCompletado) {
      whereClause.resultados.requisito.id = 7;
    }

    // Para hacer liderazgo (requisito 9) deben haber hecho doctrinas 2 (requisito 7)
    if(options?.requisito == 9 && noCompletado) {
      whereClause.resultados.requisito.id = 7;
    }

    // Para hacer encuentro de oracion (requisito 10) deben haber hecho liderazgo (requisito 9)
    if(options?.requisito == 10 && noCompletado) {
      whereClause.resultados.requisito.id = 9;
    }

    // Para hacer lider (requisito 11) deben haber hecho encuentro de oracion (requisito 10)
    if(options?.requisito == 11 && noCompletado) {
      whereClause.resultados.requisito.id = 10;
    }

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
        resultados: {
          requisito: true,
        }
      },
      where: whereClause,
      order: {
        id: 'ASC',
        resultados: {
          requisito: {
            id: requisitoOrder,
          },
        },
      }
    });

    return miembros;
  }

  async obtenerReportesExcelTodas(options: {
    id?: number;
    cedula?: string;
    rol?: number;
    no_completado?: string;
    requisito?: number;
    results_since?: Date;
    results_until?: Date;
  }): Promise<any> {
    const zonas = await this.organizacionService.obtenerZonas();
    const members = await this.obtenerMiembros(options);
    const workbook = new Workbook();
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Nombre Completo', key: 'nombre_completo', width: 50 },
    ];
    
    zonas.forEach((zona) => {
      const worksheet = workbook.addWorksheet(zona.descripcion);
      worksheet.columns = columns;

      members.forEach((member) => {
        if (member.historiales[0].zona.id !== zona.id) return;

        worksheet.addRow({
          id: member.id,
          cedula: member.cedula,
          nombre_completo: member.nombre_completo,
          zona: member.historiales[0].zona.descripcion,
        });
      });
    });

    // Guardar el archivo de Excel
    return await workbook.xlsx.writeBuffer();
  }

  async obtenerReportesExcelZona(options: {
    id?: number;
    cedula?: string;
    zona?: number;
    rol?: number;
    no_completado?: string;
    requisito?: number;
    results_since?: Date;
    results_until?: Date;
  }): Promise<any> {
    const members = await this.obtenerMiembros(options);
    const workbook = new Workbook();
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Nombre Completo', key: 'nombre_completo', width: 50 },
    ];
    const worksheet = workbook.addWorksheet(members[0].historiales[0].zona.descripcion);
    worksheet.columns = columns;

    members.forEach((member) => {
      worksheet.addRow({
        id: member.id,
        cedula: member.cedula,
        nombre_completo: member.nombre_completo,
      });
    });

    // Guardar el archivo de Excel
    return await workbook.xlsx.writeBuffer();
  }

  async obtenerEstadisticas(options: {
    zona?: number;
    requisito?: number;
  }) {
    const zona0 = Number(process.env.ZONA_0);
    const queryBuilder = this.miembroRepository
      .createQueryBuilder('m');

    if(options.zona) {
      queryBuilder.innerJoin('m.historiales', 'h')
      .where('h.zona_id = :zona', { zona: options?.zona })
      .andWhere('h.fecha_finalizacion IS NULL');
    } else {
      queryBuilder.innerJoin('m.historiales', 'h')
      .where(`h.zona_id != ${zona0}`)
      .andWhere('h.fecha_finalizacion IS NULL');
    }

    if (options?.requisito) {
      queryBuilder.andWhere('m.id IN (SELECT r.miembro_id FROM formacion.resultados r WHERE r.requisito_id = :requisito)', { requisito: options.requisito });
    }

    return await queryBuilder.getCount();
  }

  async verificarSiMiembroExiste(options: {
    cedula: string;
    nombre_completo: string;
  }): Promise<boolean> {
    return await this.miembroRepository.existsBy([{ cedula: options.cedula }, { nombre_completo: options.nombre_completo }]);
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Discapacidad,
  Educacion,
  EstadoCivil,
  Miembro,
  Ocupacion,
} from './entities';
import { DataSource, Repository } from 'typeorm';
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

    const miembroExistente = await this.miembroRepository.findOne({
      where: [
        ...(data.cedula ? [{ cedula: data.cedula }] : []),
        { nombre_completo: data.nombre_completo },
      ],
      relations: { historiales: { zona: true } },
    });

    if (miembroExistente) {
      const historialActivo = miembroExistente.historiales?.find((h) => !h.fecha_finalizacion);
      throw new HttpException(
        {
          message: 'Ya existe un miembro con la misma cedula o nombre completo',
          miembro: {
            id: miembroExistente.id,
            nombre_completo: miembroExistente.nombre_completo,
            zona: historialActivo?.zona
              ? { id: historialActivo.zona.id, descripcion: historialActivo.zona.descripcion }
              : null,
          },
        },
        HttpStatus.CONFLICT,
      );
    }

    const fechaNacimientoValida =
      data.fecha_nacimiento instanceof Date && !isNaN(data.fecha_nacimiento.getTime())
        ? data.fecha_nacimiento
        : null;
    const cedulaValida = data.cedula?.trim() || null;
    const telefonoValido = data.telefono?.trim() || null;

    const miembro = this.miembroRepository.create({
      cedula: cedulaValida,
      nombre_completo: data.nombre_completo,
      fecha_nacimiento: fechaNacimientoValida,
      telefono: telefonoValido,
      hijos: data.hijos ?? null,
      ...(data.estado_civil_id ? { estado_civil: { id: data.estado_civil_id } } : {}),
      ...(data.educacion_id ? { educacion: { id: data.educacion_id } } : {}),
      ...(data.ocupacion_id ? { ocupacion: { id: data.ocupacion_id } } : {}),
      ...(data.discapacidad_id ? { discapacidad: { id: data.discapacidad_id } } : {}),
    });
  
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(miembro);

      if (historial?.zona_id) {
        const historialMiembro = await this.organizacionService.crearHistorialMiembro(historial, queryRunner);
        historialMiembro.miembro = miembro;
        await queryRunner.manager.save(historialMiembro);
      }

      await queryRunner.commitTransaction();
    } catch(err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al crear miembro. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    if(requisito?.requisito_ids && requisito.requisito_ids?.length > 0) {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    miembro.cedula = data.cedula ? data.cedula : miembro.cedula;
    miembro.nombre_completo = data.nombre_completo ? data.nombre_completo : miembro.nombre_completo;
    miembro.telefono = data.telefono ? data.telefono : miembro.telefono;
    miembro.fecha_nacimiento = data.fecha_nacimiento ? data.fecha_nacimiento : miembro.fecha_nacimiento;
    miembro.hijos = data.hijos ? data.hijos : miembro.hijos;
    miembro.educacion = data.educacion_id ? { id: data.educacion_id } as any : miembro.educacion;
    miembro.estado_civil = data.estado_civil_id ? { id: data.estado_civil_id } as any : miembro.estado_civil;
    miembro.ocupacion = data.ocupacion_id ? { id: data.ocupacion_id } as any : miembro.ocupacion;
    miembro.discapacidad = data.discapacidad_id ? { id: data.discapacidad_id } as any : miembro.discapacidad;

    try {
      await queryRunner.manager.save(miembro);
      const nuevoHistorialMiembro = await this.organizacionService.actualizarHistorialMiembro(historial, id, queryRunner);
      if(nuevoHistorialMiembro) {
        miembro.historiales.push(nuevoHistorialMiembro);
      }
      await queryRunner.commitTransaction();
    } catch(err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
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
    supervisor?: number;
    rol?: number;
    no_completado?: string;
    requisito?: number;
    results_since?: Date;
    results_until?: Date;
    limite?: number;
    desplazamiento?: number;
    q?: string;
  }): Promise<Miembro[]> {
    const noCompletado = options?.no_completado === 'true' ? true : false;
    const zona0 = Number(process.env.ZONA_0);

    const queryBuilder = this.miembroRepository
      .createQueryBuilder('miembro')
      .leftJoinAndSelect('miembro.estado_civil', 'estado_civil')
      .leftJoinAndSelect('miembro.ocupacion', 'ocupacion')
      .leftJoinAndSelect('miembro.educacion', 'educacion')
      .leftJoinAndSelect('miembro.discapacidad', 'discapacidad')
      .leftJoinAndSelect('miembro.historiales', 'historiales')
      .leftJoinAndSelect('historiales.servicio', 'servicio')
      .leftJoinAndSelect('historiales.zona', 'zona')
      .leftJoinAndSelect('historiales.supervisor', 'supervisor')
      .leftJoinAndSelect('miembro.resultados', 'resultados')
      .leftJoinAndSelect('resultados.requisito', 'requisito');

    if (options?.id) queryBuilder.andWhere('miembro.id = :id', { id: options.id });

    if (options?.cedula) queryBuilder.andWhere('miembro.cedula = :cedula', { cedula: options.cedula });
    
    if (options?.zona) {
      if (options?.zona == 0) queryBuilder.andWhere('zona.id != :zona0', { zona0 });
      else queryBuilder.andWhere('zona.id = :zona', { zona: options.zona });
    } 
    
    if (options?.rol) queryBuilder.andWhere('servicio.id = :rol', { rol: options.rol });
    
    if (Number(options?.supervisor)) queryBuilder.andWhere('supervisor.id = :supervisor', { supervisor: options.supervisor });
    
    if (options?.results_since && options?.results_until) {
      // Convert to Date objects if they're strings
      const since = options.results_since instanceof Date ? 
      options.results_since : 
      new Date(options.results_since);
      
      const until = options.results_until instanceof Date ? 
      options.results_until : 
      new Date(options.results_until);
      
      // Set time to start of day for since and end of day for until
      since.setHours(0, 0, 0, 0);
      until.setHours(23, 59, 59, 999);
      
      queryBuilder.andWhere('resultados.creado_en BETWEEN :since AND :until', {
      since,
      until,
      });
    }
    
    if (options?.requisito) {
      if (noCompletado) {
        const membersWithRequirement = await this.miembroRepository
          .createQueryBuilder('miembro')
          .innerJoin('miembro.resultados', 'resultados')
          .innerJoin('resultados.requisito', 'requisito')
          .where('requisito.id = :requisitoId', { requisitoId: options.requisito })
          .select('miembro.id')
          .getRawMany();

        queryBuilder.andWhere('miembro.id NOT IN (:...ids)', {
          ids: membersWithRequirement.map(({ miembro_id }) => miembro_id),
        });

        // Additional conditions for specific requisitos
        if (options.requisito == 5) queryBuilder.andWhere('requisito.id = 4');
        if (options.requisito == 6) queryBuilder.andWhere('requisito.id = 5');
        if (options.requisito == 7) queryBuilder.andWhere('requisito.id = 6');
        if (options.requisito == 8) queryBuilder.andWhere('requisito.id = 7');
        if (options.requisito == 9) queryBuilder.andWhere('requisito.id = 7');
        if (options.requisito == 11) queryBuilder.andWhere('requisito.id = 10');
      } else {
        queryBuilder.andWhere('requisito.id = :requisito', { requisito: options.requisito });
      }
    }

    if(options.q) {
      queryBuilder.andWhere('(miembro.nombre_completo ILIKE :q OR miembro.cedula ILIKE :q)', { q: `%${options.q}%` });
    }

    // Order by miembro.id first
    queryBuilder.orderBy('miembro.nombre_completo', 'ASC');
    
    // Apply pagination
    if (options.desplazamiento) queryBuilder.skip(Number(options.desplazamiento));
    if (options.limite) queryBuilder.take(Number(options.limite));
    
    const miembros = await queryBuilder.getMany();

    return miembros;
  }

  async obtenerReportesExcelTodas(options: {
    id?: number;
    cedula?: string;
    rol?: number;
    no_completado?: string;
    requisito?: number;
    zona?: number;
    results_since?: Date;
    results_until?: Date;
  }): Promise<any> {
    const zonas = await this.organizacionService.obtenerZonas();
    const members = await this.obtenerMiembros({});
    const workbook = new Workbook();
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Nombre Completo', key: 'nombre_completo', width: 50 },
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Proceso actual', key: 'proceso_actual', width: 50 },
      { header: 'Supervisor', key: 'supervisor', width: 50 },
    ];
    
    zonas.forEach((zona) => {
      const worksheet = workbook.addWorksheet(zona.descripcion);
      worksheet.columns = columns;

      members.forEach((member) => {
        if (member?.historiales[0]?.zona?.id !== zona?.id) return;

        worksheet.addRow({
          id: member?.id,
          cedula: member?.cedula ?? 'NINGUNA',
          nombre_completo: member?.nombre_completo,
          zona: member?.historiales[0]?.zona?.descripcion,
          telefono: member?.telefono ?? 'NINGUNO',
          proceso_actual: member?.resultados[0]?.requisito?.nombre ?? 'SIN PROCESO',
          supervisor: member?.historiales[0]?.supervisor?.nombre_completo ?? 'N/A',
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
      { header: 'Teléfono', key: 'telefono', width: 20 },
      { header: 'Proceso actual', key: 'proceso_actual', width: 50 },
      { header: 'Supervisor', key: 'supervisor', width: 50 },
    ];
    const worksheet = workbook.addWorksheet(members[0].historiales[0].zona.descripcion);
    worksheet.columns = columns;

    members.forEach((member) => {
      worksheet.addRow({
        id: member.id,
        cedula: member.cedula ?? 'NINGUNA',
        nombre_completo: member.nombre_completo,
        telefono: member.telefono ?? 'NINGUNO',
        proceso_actual: member.resultados[0].requisito?.nombre ?? 'SIN PROCESO',
        supervisor: member.historiales[0].supervisor?.nombre_completo ?? 'N/A',
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

  async obtenerEstadisticasExcel(): Promise<any> {
    const zonas = await this.organizacionService.obtenerZonas();
    const requisitos = await this.formationService.obtenerRequisitos({});

    const columns = [
      { header: 'Zona', key: 'zona', width: 20 },
      { header: 'Membresia', key: 'membresia', width: 20 },
      { header: 'Grupo de Conexion', key: 'grupo_conexion', width: 20 },
      { header: 'Primeros Pasos', key: 'primeros_pasos', width: 20 },
      { header: 'Bautismo', key: 'bautismo', width: 20 },
      { header: 'Encuentro', key: 'encuentro', width: 20 },
      { header: 'Pos Encuentro', key: 'pos_encuentro', width: 20 },
      { header: 'Doctrinas 1', key: 'doctrinas_1', width: 20 },
      { header: 'Doctrinas 2', key: 'doctrinas_2', width: 20 },
      { header: 'Entt de Liderazgo', key: 'entt_liderazgo', width: 20 },
      { header: 'Liderazgo', key: 'liderazgo', width: 15 },
      { header: 'Encuentro de Oracion', key: 'encuentro_oracion', width: 20 },
      { header: 'Lider', key: 'lider', width: 20 },
    ];
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Resumen');
    worksheet.columns = columns;

    for(const zona of zonas) {
      if(zona.id === Number(process.env.ZONA_0)) continue;

      var row = {
        zona: '',
        membresia: 0,
        grupo_conexion: 0,
        primeros_pasos: 0,
        bautismo: 0,
        encuentro: 0,
        pos_encuentro: 0,
        doctrinas_1: 0,
        doctrinas_2: 0,
        entt_liderazgo: 0,
        liderazgo: 0,
        encuentro_oracion: 0,
        lider: 0,
      };

      for(const requisito of requisitos) {
        const cantidad = await this.obtenerEstadisticas({ zona: zona.id, requisito: requisito.id });

        switch (requisito.id) {
          case 1:
            row.grupo_conexion = cantidad;
            break;
          case 2:
            row.primeros_pasos = cantidad;
            break;
          case 3:
            row.bautismo = cantidad;
            break;
          case 4:
            row.encuentro = cantidad;
            break;
          case 5:
            row.pos_encuentro = cantidad;
            break;
          case 6:
            row.doctrinas_1 = cantidad;
            break;
          case 7:
            row.doctrinas_2 = cantidad;
            break;
          case 8:
            row.entt_liderazgo = cantidad;
            break;
          case 9:
            row.liderazgo = cantidad;
            break;
          case 10:
            row.encuentro_oracion = cantidad;
            break;
          case 11:
            row.lider = cantidad;
            break;
        }
      }

      row.membresia = await this.obtenerEstadisticas({ zona: zona.id });
      row.zona = zona.descripcion;
      worksheet.addRow(row);
    }

    var finalRow = {
      zona: 'Total',
      membresia: 0,
      grupo_conexion: 0,
      primeros_pasos: 0,
      bautismo: 0,
      encuentro: 0,
      pos_encuentro: 0,
      doctrinas_1: 0,
      doctrinas_2: 0,
      entt_liderazgo: 0,
      liderazgo: 0,
      encuentro_oracion: 0,
      lider: 0,
    };

    for(const requisito of requisitos) {

      const cantidad = await this.obtenerEstadisticas({ requisito: requisito.id });

      switch (requisito.id) {
        case 1:
          finalRow.grupo_conexion = cantidad;
          break;
        case 2:
          finalRow.primeros_pasos = cantidad;
          break;
        case 3:
          finalRow.bautismo = cantidad;
          break;
        case 4:
          finalRow.encuentro = cantidad;
          break;
        case 5:
          finalRow.pos_encuentro = cantidad;
          break;
        case 6:
          finalRow.doctrinas_1 = cantidad;
          break;
        case 7:
          row.doctrinas_2 = cantidad;
          break;
        case 8:
          finalRow.entt_liderazgo = cantidad;
          break;
        case 9:
          finalRow.liderazgo = cantidad;
          break;
        case 10:
          finalRow.encuentro_oracion = cantidad;
          break;
        case 11:
          finalRow.lider = cantidad;
          break;
      }

    }

    finalRow.membresia = await this.obtenerEstadisticas({});
    
    worksheet.addRow(finalRow);

    return await workbook.xlsx.writeBuffer();
  }

  async obtenerEstadisticasZonaExcel(options: {
    zona: number;
  }): Promise<any> {
    const zona = await this.organizacionService.obtenerZona(options.zona);
    const requisitos = await this.formationService.obtenerRequisitos({});

    const columns = [
      { header: 'Grupo de Conexion', key: 'grupo_conexion', width: 20 },
      { header: 'Membresia', key: 'membresia', width: 20 },
      { header: 'Primeros Pasos', key: 'primeros_pasos', width: 20 },
      { header: 'Bautismo', key: 'bautismo', width: 20 },
      { header: 'Encuentro', key: 'encuentro', width: 20 },
      { header: 'Pos Encuentro', key: 'pos_encuentro', width: 20 },
      { header: 'Doctrinas 1', key: 'doctrinas_1', width: 20 },
      { header: 'Doctrinas 2', key: 'doctrinas_2', width: 20 },
      { header: 'Entt de Liderazgo', key: 'entt_liderazgo', width: 20 },
      { header: 'Liderazgo', key: 'liderazgo', width: 15 },
      { header: 'Encuentro de Oracion', key: 'encuentro_oracion', width: 20 },
      { header: 'Lider', key: 'lider', width: 20 },
    ];
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Resumen');
    worksheet.columns = columns;

    var row = {
      zona: zona.descripcion,
      grupo_conexion: 0,
      primeros_pasos: 0,
      bautismo: 0,
      encuentro: 0,
      pos_encuentro: 0,
      doctrinas_1: 0,
      doctrinas_2: 0,
      entt_liderazgo: 0,
      liderazgo: 0,
      encuentro_oracion: 0,
      lider: 0,
      membresia: 0,
    };

    for(const requisito of requisitos) {
      const cantidad = await this.obtenerEstadisticas({ zona: zona.id, requisito: requisito.id });

      switch (requisito.id) {
        case 1:
          row.grupo_conexion = cantidad;
          break;
        case 2:
          row.primeros_pasos = cantidad;
          break;
        case 3:
          row.bautismo = cantidad;
          break;
        case 4:
          row.encuentro = cantidad;
          break;
        case 5:
          row.pos_encuentro = cantidad;
          break;
        case 6:
          row.doctrinas_1 = cantidad;
          break;
        case 7:
          row.doctrinas_2 = cantidad;
          break;
        case 8:
          row.entt_liderazgo = cantidad;
          break;
        case 9:
          row.liderazgo = cantidad;
          break;
        case 10:
          row.encuentro_oracion = cantidad;
          break;
        case 11:
          row.lider = cantidad;
          break;
      }
    }

    row.membresia = await this.obtenerEstadisticas({ zona: zona.id });

    worksheet.addRow(row);

    return await workbook.xlsx.writeBuffer();
  }

  async obtenerMiembroExistentePorIdentificacion(
    cedula: string,
    nombre_completo: string,
  ): Promise<Miembro | null> {
    return await this.miembroRepository.findOne({
      where: [
        ...(cedula ? [{ cedula }] : []),
        { nombre_completo },
      ],
      relations: { historiales: { zona: true } },
    });
  }

  async transferirZona(miembroId: number, zonaId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.organizacionService.actualizarHistorialMiembro({ zona_id: zonaId }, miembroId, queryRunner);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        'Error al transferir zona. Por favor, intente mas tarde',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async importarMiembros(
    miembros: import('./dtos/importar-miembro.dto').ImportarMiembroDto[],
    transferir: boolean,
  ): Promise<import('./dtos/importar-miembro.dto').ImportarMiembrosResultado> {
    const BAUTISMO_REQUISITO_IDS = [1, 2, 3];
    let importados = 0;
    let transferidos = 0;
    let omitidos = 0;
    let fallidos = 0;
    const detalle: import('./dtos/importar-miembro.dto').ImportarMiembroResultadoItem[] = [];

    const zonas = await this.organizacionService.obtenerZonas();
    const nombreZona = (id: number) => zonas.find((z) => z.id === id)?.descripcion ?? `zona ${id}`;

    for (const row of miembros) {
      const nombre = row.nombre_completo?.trim().toUpperCase();
      try {
        const existente = await this.obtenerMiembroExistentePorIdentificacion(row.cedula, nombre);

        if (existente) {
          const historialActivo = existente.historiales?.find((h) => !h.fecha_finalizacion);
          const zonaActualId = historialActivo?.zona?.id;
          const zonaActual = historialActivo?.zona?.descripcion ?? 'zona desconocida';
          const zonaDestino = nombreZona(row.zona_id);

          // Already in the target zone — nothing to do
          if (zonaActualId === row.zona_id) {
            omitidos++;
            detalle.push({ nombre_completo: nombre, cedula: row.cedula, exito: true, omitido: true, error: `Ya existe en la zona ${zonaActual}` });
            continue;
          }

          if (transferir) {
            await this.transferirZona(existente.id, row.zona_id);
            transferidos++;
            detalle.push({ nombre_completo: nombre, cedula: row.cedula, exito: true, transferido: true });
          } else {
            fallidos++;
            detalle.push({
              nombre_completo: nombre,
              cedula: row.cedula,
              exito: false,
              error: `Ya existe en el sistema (zona actual: ${zonaActual} → zona destino: ${zonaDestino})`,
            });
          }
          continue;
        }

        const parsedFecha = row.fecha_nacimiento ? new Date(row.fecha_nacimiento) : undefined;
        const fechaNacimiento = parsedFecha && !isNaN(parsedFecha.getTime()) ? parsedFecha : undefined;

        const miembro = await this.crearMiembro({
          nombre_completo: nombre,
          cedula: row.cedula?.trim() || undefined,
          telefono: row.telefono?.trim() || undefined,
          fecha_nacimiento: fechaNacimiento,
          historial: { zona_id: row.zona_id },
          ...(row.bautizado ? { requisito: { requisito_ids: BAUTISMO_REQUISITO_IDS } } : {}),
        });

        importados++;
        detalle.push({ nombre_completo: miembro.nombre_completo, cedula: miembro.cedula, exito: true });
      } catch (err) {
        fallidos++;
        const msg = err?.response?.message ?? err?.message ?? 'Error desconocido';
        detalle.push({ nombre_completo: nombre, cedula: row.cedula, exito: false, error: msg });
      }
    }

    return { importados, transferidos, omitidos, fallidos, detalle };
  }
}

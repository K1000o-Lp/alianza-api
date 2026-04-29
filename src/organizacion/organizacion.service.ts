import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoSolicitud, HistorialMiembro, Servicio, SolicitudTransferencia, Zona, ZonaSupervisor } from './entities';
import { crearHistorialMiembroDto } from './dtos/crear-historial-miembro.dto';
import { crearZonaSupervisorDto } from './dtos/crear-zona-supervisor.dto';

@Injectable()
export class OrganizacionService {
  constructor(
    @InjectRepository(Zona) private zonaRepository: Repository<Zona>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(HistorialMiembro)
    private historialMiembroRepository: Repository<HistorialMiembro>,
    @InjectRepository(ZonaSupervisor)
    private zonaSupervisorRepository: Repository<ZonaSupervisor>,
    @InjectRepository(SolicitudTransferencia)
    private solicitudRepository: Repository<SolicitudTransferencia>,
    private dataSource: DataSource
  ) {}

  async obtenerZonas(): Promise<Zona[]> {
    return await this.zonaRepository.find();
  }

  async obtenerZona(id: number): Promise<Zona> {
    return await this.zonaRepository.findOne({where: { id: id } });
  }

  async obtenerServicios(): Promise<Servicio[]> {
    return await this.servicioRepository.find();
  }

  async crearHistorialMiembro(
    dto: crearHistorialMiembroDto,
    queryRunner?: import('typeorm').QueryRunner,
  ): Promise<HistorialMiembro> {
    const { ...data } = dto;

    const historialMiembro = this.historialMiembroRepository.create({
      ...(data.servicio_id ? { servicio: { id: data.servicio_id } } : {}),
      ...(data.zona_id ? { zona: { id: data.zona_id } } : {}),
      ...(data.supervisor_id ? { supervisor: { id: data.supervisor_id } } : {}),
    });

    if (queryRunner) {
      await queryRunner.manager.save(historialMiembro);
      return historialMiembro;
    }

    const ownQueryRunner = this.dataSource.createQueryRunner();
    await ownQueryRunner.connect();
    await ownQueryRunner.startTransaction();

    try {
      await ownQueryRunner.manager.save(historialMiembro);
      await ownQueryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await ownQueryRunner.rollbackTransaction();
      throw new HttpException('Error al crear miembro. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await ownQueryRunner.release();
    }

    return historialMiembro;
  }

  async actualizarHistorialMiembro(
    dto: Partial<crearHistorialMiembroDto>,
    miembroId: number,
    queryRunner?: import('typeorm').QueryRunner,
  ): Promise<HistorialMiembro|null> {
    const { ...data } = dto;

    const historialViejo = await this.historialMiembroRepository.findOne({ 
      relations: {
        miembro: true,
        zona: true,
        servicio: true,
        supervisor: true,
      }, 
      where: { miembro: { id: miembroId }, fecha_finalizacion: null } });

    const historialMiembro = this.historialMiembroRepository.create({
      servicio: { id: data.servicio_id },
      zona: { id: data.zona_id },
      miembro: { id: miembroId },
      ...(data.supervisor_id ? { supervisor: { id: data.supervisor_id } } : {}),
    });

    if(!data?.servicio_id) {
      historialMiembro.servicio = historialViejo?.servicio ?? null;
    }

    if(
      historialViejo &&
      historialViejo?.zona?.id == historialMiembro?.zona?.id &&
      historialViejo?.servicio?.id == historialMiembro?.servicio?.id &&
      historialViejo?.supervisor?.id == historialMiembro?.supervisor?.id
    ) {
      return null; 
    }

    const doWork = async (qr: import('typeorm').QueryRunner) => {
      await qr.manager
        .createQueryBuilder()
        .softDelete()
        .from(HistorialMiembro)
        .where('miembro_id = :miembroId', { miembroId })
        .execute();
      await qr.manager.save(historialMiembro);
    };

    if (queryRunner) {
      await doWork(queryRunner);
      return historialMiembro;
    }

    const ownQueryRunner = this.dataSource.createQueryRunner();
    await ownQueryRunner.connect();
    await ownQueryRunner.startTransaction();

    try {
      await doWork(ownQueryRunner);
      await ownQueryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await ownQueryRunner.rollbackTransaction();
      throw new HttpException('Error al actualizar historial. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await ownQueryRunner.release();
    }

    return historialMiembro;
  }

  async obtenerSupervisores(options: { zona_id?: number }): Promise<ZonaSupervisor[]> {
    if(options?.zona_id == 0) {
      return await this.zonaSupervisorRepository.find({ relations: { miembro: true } });
    }

    return await this.zonaSupervisorRepository.find({ where: { zona: { id: options?.zona_id } }, relations: { miembro: true }});
  }

  async obtenerSupervisor(id: number): Promise<ZonaSupervisor> {
    return await this.zonaSupervisorRepository.findOne({ where: { id: id }, relations: { miembro: true } });
  }

  async crearSupervisor(dto: crearZonaSupervisorDto): Promise<ZonaSupervisor[]> {
    const { miembro_ids, zona_id } = dto;

    if(zona_id == 0) {
      throw new HttpException('No se puede asignar supervisor a todas las zonas', HttpStatus.BAD_REQUEST);
    }

    let supervisors: ZonaSupervisor[] = [];

    miembro_ids.forEach((miembro_id) => {
      supervisors.push(this.zonaSupervisorRepository.create({
        zona: { id: zona_id },
        miembro: { id: miembro_id },
      }));
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      supervisors.forEach(async supervisor => {
        await queryRunner.manager.save(supervisor);
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al crear supervisor. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    return supervisors;
  }

  async eliminarSupervisor(id: number): Promise<void>{
    const supervisor = await this.zonaSupervisorRepository.findOne({ where: { id: id } });

    if(!supervisor) {
      throw new HttpException('Supervisor no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.zonaSupervisorRepository.softDelete({ id: id });
  }

  // ─── Solicitudes de transferencia ────────────────────────────────────────

  async crearSolicitudTransferencia(dto: {
    miembro_id: number;
    zona_origen_id: number;
    zona_destino_id: number;
    solicitante_id?: number;
  }): Promise<SolicitudTransferencia> {
    // Prevent duplicates: only one pending request per miembro+destino
    const existe = await this.solicitudRepository.findOne({
      where: {
        miembro: { id: dto.miembro_id },
        zona_destino: { id: dto.zona_destino_id },
        estado: EstadoSolicitud.PENDIENTE,
      },
    });

    if (existe) {
      throw new HttpException(
        'Ya existe una solicitud de transferencia pendiente para este miembro a esa zona.',
        HttpStatus.CONFLICT,
      );
    }

    const solicitud = this.solicitudRepository.create({
      miembro: { id: dto.miembro_id },
      zona_origen: { id: dto.zona_origen_id },
      zona_destino: { id: dto.zona_destino_id },
      ...(dto.solicitante_id ? { solicitante: { id: dto.solicitante_id } } : {}),
      estado: EstadoSolicitud.PENDIENTE,
    });

    return await this.solicitudRepository.save(solicitud);
  }

  async obtenerSolicitudesTransferencia(options: {
    zona_origen_id?: number;
    zona_destino_id?: number;
    estado?: EstadoSolicitud;
  }): Promise<SolicitudTransferencia[]> {
    const qb = this.solicitudRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.miembro', 'miembro')
      .leftJoinAndSelect('s.zona_origen', 'zona_origen')
      .leftJoinAndSelect('s.zona_destino', 'zona_destino')
      .leftJoinAndSelect('s.solicitante', 'solicitante')
      .leftJoinAndSelect('solicitante.miembro', 'solicitante_miembro')
      .leftJoinAndSelect('s.aprobado_por', 'aprobado_por')
      .leftJoinAndSelect('aprobado_por.miembro', 'aprobado_por_miembro')
      .orderBy('s.creado_en', 'DESC');

    if (options.zona_origen_id) {
      qb.andWhere('zona_origen.id = :zonaOrigen', { zonaOrigen: options.zona_origen_id });
    }
    if (options.zona_destino_id) {
      qb.andWhere('zona_destino.id = :zonaDestino', { zonaDestino: options.zona_destino_id });
    }
    if (options.estado) {
      qb.andWhere('s.estado = :estado', { estado: options.estado });
    }

    return await qb.getMany();
  }

  async aprobarSolicitudTransferencia(
    solicitudId: number,
    aprobadorId: number,
  ): Promise<SolicitudTransferencia> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
      relations: { miembro: true, zona_destino: true, zona_origen: true },
    });

    if (!solicitud) {
      throw new HttpException('Solicitud no encontrada', HttpStatus.NOT_FOUND);
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new HttpException('La solicitud ya fue procesada', HttpStatus.CONFLICT);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Transfer the member to the destination zone
      await this.actualizarHistorialMiembro(
        { zona_id: solicitud.zona_destino.id },
        solicitud.miembro.id,
        queryRunner,
      );

      solicitud.estado = EstadoSolicitud.APROBADA;
      solicitud.aprobado_en = new Date();
      solicitud.aprobado_por = { id: aprobadorId } as any;

      await queryRunner.manager.save(solicitud);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(
        'Error al aprobar la solicitud. Por favor, intente más tarde.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }

    return solicitud;
  }

  async rechazarSolicitudTransferencia(
    solicitudId: number,
    aprobadorId: number,
  ): Promise<SolicitudTransferencia> {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new HttpException('Solicitud no encontrada', HttpStatus.NOT_FOUND);
    }

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new HttpException('La solicitud ya fue procesada', HttpStatus.CONFLICT);
    }

    solicitud.estado = EstadoSolicitud.RECHAZADA;
    solicitud.aprobado_en = new Date();
    solicitud.aprobado_por = { id: aprobadorId } as any;

    return await this.solicitudRepository.save(solicitud);
  }
}

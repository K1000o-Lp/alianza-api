import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HistorialMiembro, Servicio, Zona, ZonaSupervisor } from './entities';
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
  ): Promise<HistorialMiembro> {
    const { ...data } = dto;

    const historialMiembro = this.historialMiembroRepository.create({
      servicio: { id: data.servicio_id },
      zona: { id: data.zona_id },
      ...(data.supervisor_id ? { supervisor: { id: data.supervisor_id } } : {}),
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(historialMiembro);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al crear miembro. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    return historialMiembro;
  }

  async actualizarHistorialMiembro(dto: Partial<crearHistorialMiembroDto>, miembroId: number): Promise<HistorialMiembro|null> {
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
      ...(data.supervisor_id ? { supervisor: { id: data.supervisor_id } } : {}),
    });

    if(!data?.servicio_id) {
      historialMiembro.servicio = historialViejo.servicio;
    }

    if(historialViejo?.zona?.id == historialMiembro?.zona?.id && historialViejo?.servicio?.id == historialMiembro?.servicio?.id && historialViejo?.supervisor?.id == historialMiembro?.supervisor?.id) {
      return null; 
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      await this.historialMiembroRepository.softDelete({ miembro: { id: miembroId } });
      await queryRunner.manager.save(historialMiembro);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al actualizar historial. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
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
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HistorialMiembro, Servicio, Zona } from './entities';
import { crearHistorialMiembroDto } from './dtos/crear-historial-miembro.dto';

@Injectable()
export class OrganizacionService {
  constructor(
    @InjectRepository(Zona) private zonaRepository: Repository<Zona>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(HistorialMiembro)
    private historialMiembroRepository: Repository<HistorialMiembro>,
    private dataSource: DataSource
  ) {}

  async obtenerZonas(): Promise<Zona[]> {
    return await this.zonaRepository.find();
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
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(historialMiembro);
      await queryRunner.commitTransaction();
    } catch (err) {
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
      }, 
      where: { miembro: { id: miembroId }, fecha_finalizacion: null } });

    const historialMiembro = this.historialMiembroRepository.create({
      servicio: { id: data.servicio_id },
      zona: { id: data.zona_id },
    });

    if(historialViejo.zona.id === historialMiembro.zona.id && historialViejo.servicio.id === historialMiembro.servicio.id) {
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
      await queryRunner.rollbackTransaction();
      throw new HttpException('Error al actualizar historial. Por favor, intente mas tarde', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }

    return historialMiembro;
  }
}

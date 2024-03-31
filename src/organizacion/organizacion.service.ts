import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    await this.historialMiembroRepository.save(historialMiembro);

    return historialMiembro;
  }
}

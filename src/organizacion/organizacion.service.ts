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
    crearHistorialMiembroDto: crearHistorialMiembroDto,
  ): Promise<HistorialMiembro> {
    const { ...data } = crearHistorialMiembroDto;

    const historialMiembro = this.historialMiembroRepository.create({
      lider: { miembro_id: data.lider_fk_id },
      supervisor: { miembro_id: data.lider_fk_id },
      servicio: { servicio_id: data.servicio_fk_id },
      zona: { zona_id: data.zona_fk_id },
    });

    await this.historialMiembroRepository.save(historialMiembro);

    return historialMiembro;
  }
}

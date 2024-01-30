import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistorialMiembro } from './historial-miembro.entity';

@Entity({ schema: 'organizacion', name: 'servicios' })
export class Servicio {
  @PrimaryGeneratedColumn()
  servicio_id: number;

  @Column()
  descripcion: string;

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.servicio,
  )
  historial_miembros: HistorialMiembro[];
}

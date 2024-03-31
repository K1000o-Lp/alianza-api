import { Miembro } from 'src/persona/entities';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm';
import { Servicio } from './servicio.entity';
import { Zona } from './zona.entity';

@Entity({ schema: 'organizacion', name: 'historial_miembros' })
export class HistorialMiembro {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.historiales)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Servicio, (servicio) => servicio.historial_miembros)
  @JoinColumn({ name: 'servicio_id' })
  servicio: Servicio;

  @ManyToOne(() => Zona, (zona) => zona.historial_miembros)
  @JoinColumn({ name: 'zona_id' })
  zona: Zona;

  @CreateDateColumn()
  fecha_inicio: Timestamp;

  @DeleteDateColumn()
  fecha_finalizacion: Timestamp;
}

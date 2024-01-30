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
  historial_miembro_id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.historiales)
  @JoinColumn({ name: 'miembro_fk_id' })
  miembro: Miembro;

  @ManyToOne(() => Miembro, (miembro) => miembro.liderados)
  @JoinColumn({ name: 'lider_fk_id' })
  lider: Miembro;

  @ManyToOne(() => Miembro, (miembro) => miembro.supervisados)
  @JoinColumn({ name: 'supervidor_fk_id' })
  supervisor: Miembro;

  @ManyToOne(() => Servicio, (servicio) => servicio.historial_miembros)
  @JoinColumn({ name: 'servicio_fk_id' })
  servicio: Servicio;

  @ManyToOne(() => Zona, (zona) => zona.historial_miembros)
  @JoinColumn({ name: 'zona_fk_id' })
  zona: Zona;

  @CreateDateColumn()
  fecha_inicio: Timestamp;

  @DeleteDateColumn()
  fecha_finalizacion: Timestamp;
}

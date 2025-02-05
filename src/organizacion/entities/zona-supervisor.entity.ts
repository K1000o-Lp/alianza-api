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

import { Zona } from '.';

@Entity({ schema: 'organizacion', name: 'zona_supervisor' })
export class ZonaSupervisor {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Zona, (zona) => zona.historial_miembros)
  @JoinColumn({ name: 'zona_id' })
  zona: Zona;

  @ManyToOne(() => Miembro, (miembro) => miembro.historiales)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @CreateDateColumn()
  fecha_inicio: Timestamp;

  @DeleteDateColumn()
  fecha_finalizacion: Timestamp;
}

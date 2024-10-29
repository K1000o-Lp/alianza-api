import { Miembro } from 'src/persona/entities';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Timestamp,
} from 'typeorm';

import { Evento } from '.';

@Entity({ schema: 'formacion', name: 'asistencias' })
export class Asistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Evento, (evento) => evento.asistencias)
  @JoinColumn({ name: 'evento_id' })
  evento: Evento;

  @ManyToOne(() => Miembro, (miembro) => miembro.asistencias)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @CreateDateColumn()
  creado_en: Timestamp;
}

import { Zona } from 'src/organizacion/entities';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asistencia } from './asistencia.entity';

@Entity({ schema: 'formacion', name: 'eventos' })
export class Evento {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Zona, (zona) => zona.eventos)
  @JoinColumn({ name: 'zona_id' })
  zona: Zona;

  @OneToMany(() => Asistencia, (asistencia) => asistencia.miembro)
  asistencias: Asistencia[];

  @Column()
  nombre: string;

  @Column()
  descripcion: string;
}

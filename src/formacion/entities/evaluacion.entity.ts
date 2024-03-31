import { Miembro } from 'src/persona/entities';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';
import { Requisito } from './requisito.entity';

@Entity({ schema: 'formacion', name: 'evaluaciones' })
export class Evaluacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.evaluaciones)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Requisito, (requisito) => requisito.evaluaciones)
  @JoinColumn({ name: 'requisito_id' })
  requisito: Requisito;

  @Column({ default: false })
  resultado: boolean;

  @CreateDateColumn()
  creado_en: Timestamp;

  @UpdateDateColumn()
  modificado_en: Timestamp;

  @DeleteDateColumn()
  eliminado_en: Timestamp;
}

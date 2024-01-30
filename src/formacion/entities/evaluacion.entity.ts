import { Miembro } from 'src/persona/entities';
import {
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
import { Competencia } from './competencia.entity';

@Entity({ schema: 'formacion', name: 'evaluaciones' })
export class Evaluacion {
  @PrimaryGeneratedColumn()
  evaluacion_id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.evaluaciones)
  @JoinColumn({ name: 'miembro_fk_id' })
  miembro: Miembro;

  @ManyToOne(() => Requisito, (requisito) => requisito.evaluaciones)
  @JoinColumn({ name: 'requisito_fk_id' })
  requisito: Requisito;

  @ManyToOne(() => Competencia, (competencia) => competencia.evaluaciones)
  @JoinColumn({ name: 'competencia_fk_id' })
  competencia: Competencia;

  @CreateDateColumn()
  creado_en: Timestamp;

  @UpdateDateColumn()
  modificado_en: Timestamp;

  @DeleteDateColumn()
  eliminado_en: Timestamp;
}

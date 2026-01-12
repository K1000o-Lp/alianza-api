import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';

import { Miembro } from 'src/persona/entities';
import { Requisito } from '.';

@Entity({ schema: 'formacion', name: 'resultados' })
@Index(['miembro', 'requisito'], { unique: true })
export class Resultado {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, (miembro) => miembro.resultados)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Requisito, (requisito) => requisito.resultados)
  @JoinColumn({ name: 'requisito_id' })
  requisito: Requisito;

  @CreateDateColumn()
  creado_en: Timestamp;

  @UpdateDateColumn()
  modificado_en: Timestamp;

  @DeleteDateColumn()
  eliminado_en: Timestamp;
}

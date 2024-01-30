import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Formacion } from './formacion.entity';
import { Evaluacion } from './evaluacion.entity';

@Entity({ schema: 'formacion', name: 'requisitos' })
export class Requisito {
  @PrimaryGeneratedColumn()
  requisito_id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @ManyToMany(() => Formacion, (formacion) => formacion.requisitos)
  @JoinTable({
    name: 'formaciones_requisitos',
    joinColumn: {
      name: 'requisito_fk_id',
      referencedColumnName: 'requisito_id',
    },
    inverseJoinColumn: {
      name: 'formacion_fk_id',
      referencedColumnName: 'formacion_id',
    },
  })
  formaciones: Formacion[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.requisito)
  evaluaciones: Evaluacion[];
}

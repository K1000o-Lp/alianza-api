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
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @ManyToMany(() => Formacion, (formacion) => formacion.requisitos)
  @JoinTable({
    name: 'formaciones_requisitos',
    joinColumn: {
      name: 'requisito_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'formacion_id',
      referencedColumnName: 'id',
    },
  })
  formaciones: Formacion[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.requisito)
  evaluaciones: Evaluacion[];
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Evaluacion } from './evaluacion.entity';

@Entity({ schema: 'formacion', name: 'competencias' })
export class Competencia {
  @PrimaryGeneratedColumn()
  competencia_id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.competencia)
  evaluaciones: Evaluacion[];
}

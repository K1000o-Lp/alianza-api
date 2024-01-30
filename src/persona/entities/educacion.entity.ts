import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Miembro } from './miembro.entity';

@Entity({ schema: 'persona', name: 'educaciones' })
export class Educacion {
  @PrimaryGeneratedColumn()
  educacion_id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.educacion)
  miembros: Miembro[];
}

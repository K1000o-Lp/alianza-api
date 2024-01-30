import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Miembro } from './miembro.entity';

@Entity({ schema: 'persona', name: 'dicapacidades' })
export class Discapacidad {
  @PrimaryGeneratedColumn()
  discapacidad_id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.discapacidad)
  miembros: Miembro[];
}

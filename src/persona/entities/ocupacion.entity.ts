import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Miembro } from './miembro.entity';

@Entity({ schema: 'persona', name: 'ocupaciones' })
export class Ocupacion {
  @PrimaryGeneratedColumn()
  ocupacion_id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.ocupacion)
  miembros: Miembro[];
}

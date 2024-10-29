import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Miembro } from '.';

@Entity({ schema: 'persona', name: 'discapacidades' })
export class Discapacidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.discapacidad)
  miembros: Miembro[];
}

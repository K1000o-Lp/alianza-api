import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Miembro } from '.';

@Entity({ schema: 'persona', name: 'ocupaciones' })
export class Ocupacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.ocupacion)
  miembros: Miembro[];
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Miembro } from '.';

@Entity({ schema: 'persona', name: 'educaciones' })
export class Educacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.educacion)
  miembros: Miembro[];
}

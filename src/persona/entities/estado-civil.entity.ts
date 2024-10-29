import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Miembro } from '.';

@Entity({ schema: 'persona', name: 'estados_civiles' })
export class EstadoCivil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @OneToMany(() => Miembro, (miembro) => miembro.estado_civil)
  miembros: Miembro[];
}

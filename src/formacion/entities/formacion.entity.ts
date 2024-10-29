import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Requisito } from '.';

@Entity({ schema: 'formacion', name: 'formaciones' })
export class Formacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @ManyToMany(() => Requisito, (requisito) => requisito.formaciones)
  requisitos: Requisito[];
}

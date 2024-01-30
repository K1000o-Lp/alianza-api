import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Requisito } from './requisito.entity';

@Entity({ schema: 'formacion', name: 'formaciones' })
export class Formacion {
  @PrimaryGeneratedColumn()
  formacion_id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @ManyToMany(() => Requisito, (requisito) => requisito.formaciones)
  requisitos: Requisito[];
}

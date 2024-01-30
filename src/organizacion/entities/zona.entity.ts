import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistorialMiembro } from './historial-miembro.entity';

@Entity({ schema: 'organizacion', name: 'zonas' })
export class Zona {
  @PrimaryGeneratedColumn()
  zona_id: number;

  @Column()
  descripcion: string;

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.zona,
  )
  historial_miembros: HistorialMiembro[];
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistorialMiembro } from './historial-miembro.entity';
import { Evento } from 'src/formacion/entities/evento.entity';

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

  @OneToMany(() => Evento, (evento) => evento.zona)
  eventos: Evento[];
}

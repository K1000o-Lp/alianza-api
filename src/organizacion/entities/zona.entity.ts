import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HistorialMiembro } from './historial-miembro.entity';
import { Evento } from 'src/formacion/entities/evento.entity';
import { Usuario } from 'src/usuarios/entities';

@Entity({ schema: 'organizacion', name: 'zonas' })
export class Zona {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descripcion: string;

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.zona,
  )
  historial_miembros: HistorialMiembro[];

  @OneToMany(() => Evento, (evento) => evento.zona)
  eventos: Evento[];

  @OneToOne(() => Usuario, (usuario) => usuario.zona)
  usuario: Usuario;
}

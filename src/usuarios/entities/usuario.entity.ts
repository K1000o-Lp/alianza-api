import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Zona } from "src/organizacion/entities";
import { Miembro } from "src/persona/entities";


@Entity({ schema: 'seguridad', name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  nombre_usuario: string;

  @Column()
  contrasena: string;

  @OneToOne(() => Miembro)
  @Index({ unique: true })
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @OneToOne(() => Zona, (zona) => zona.usuario)
  @Index({ unique: true })
  @JoinColumn({ name: 'zona_id' })
  zona: Zona;
}
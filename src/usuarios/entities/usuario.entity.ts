import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Zona } from "src/organizacion/entities";
import { Miembro } from "src/persona/entities";
import { Rol } from "./rol.entity";


@Entity({ schema: 'seguridad', name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  nombre_usuario: string;

  @Column()
  contrasena: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { nullable: true, eager: true })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol | null;

  @Column({ nullable: true, type: 'text' })
  refresh_token: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  refresh_token_expira_en: Date | null;

  @OneToOne(() => Miembro)
  @Index({ unique: true })
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @OneToOne(() => Zona, (zona) => zona.usuario)
  @Index({ unique: true })
  @JoinColumn({ name: 'zona_id' })
  zona: Zona;
}
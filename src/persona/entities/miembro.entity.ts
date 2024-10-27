import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';

import { EstadoCivil, Educacion, Ocupacion, Discapacidad } from '.';
import { Usuario } from 'src/usuarios/entities';
import { HistorialMiembro } from 'src/organizacion/entities';
import { Resultado, Asistencia } from 'src/formacion/entities';

@Entity({ schema: 'persona', name: 'miembros' })
export class Miembro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  cedula: string;

  @Column()
  nombre_completo: string;

  @Column({ nullable: true })
  telefono: string;

  @Column('date', { nullable: true })
  fecha_nacimiento: Date;

  @ManyToOne(() => EstadoCivil, (estadoCivil) => estadoCivil.miembros)
  @JoinColumn({ name: 'estado_civil_id' })
  estado_civil: EstadoCivil;

  @Column()
  hijos: number;

  @ManyToOne(() => Educacion, (educacion) => educacion.miembros)
  @JoinColumn({ name: 'educacion_id' })
  educacion: Educacion;

  @ManyToOne(() => Ocupacion, (ocupacion) => ocupacion.miembros)
  @JoinColumn({ name: 'ocupacion_id' })
  ocupacion: Ocupacion;

  @ManyToOne(() => Discapacidad, (discapacidad) => discapacidad.miembros)
  @JoinColumn({ name: 'discapacidad_id' })
  discapacidad: Discapacidad;

  @OneToMany(() => Resultado, (resultado) => resultado.miembro)
  resultados: Resultado[];

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.miembro,
  )
  historiales: HistorialMiembro[];

  @OneToMany(() => Asistencia, (asistencia) => asistencia.miembro)
  asistencias: Asistencia[];

  @OneToOne(() => Usuario)
  usuario: Usuario;

  @CreateDateColumn()
  creado_en: Timestamp;

  @UpdateDateColumn()
  modificado_en: Timestamp;

  @DeleteDateColumn()
  eliminado_en: Timestamp;
}

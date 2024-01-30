import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Timestamp,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoCivil } from './estado-civil.entity';
import { Educacion } from './educacion.entity';
import { Discapacidad } from './discapacidad.entity';
import { Evaluacion } from 'src/formacion/entities/evaluacion.entity';
import { Ocupacion } from './ocupacion.entity';
import { HistorialMiembro } from 'src/organizacion/entities/historial-miembro.entity';

@Entity({ schema: 'persona', name: 'miembros' })
export class Miembro {
  @PrimaryGeneratedColumn()
  miembro_id: number;

  @Column({ nullable: true })
  cedula: string;

  @Column()
  nombre_completo: string;

  @Column({ nullable: true })
  telefono: string;

  @Column('date', { nullable: true })
  fecha_nacimiento: Date;

  @ManyToOne(() => EstadoCivil, (estadoCivil) => estadoCivil.miembros)
  @JoinColumn({ name: 'estado_civil_fk_id' })
  estado_civil: EstadoCivil;

  @Column()
  hijos: number;

  @ManyToOne(() => Educacion, (educacion) => educacion.miembros)
  @JoinColumn({ name: 'educacion_fk_id' })
  educacion: Educacion;

  @ManyToOne(() => Ocupacion, (ocupacion) => ocupacion.miembros)
  @JoinColumn({ name: 'ocupacion_fk_id' })
  ocupacion: Ocupacion;

  @ManyToOne(() => Discapacidad, (discapacidad) => discapacidad.miembros)
  @JoinColumn({ name: 'discapacidad_fk_id' })
  discapacidad: Discapacidad;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.miembro)
  evaluaciones: Evaluacion[];

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.miembro,
  )
  historiales: HistorialMiembro[];

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.lider,
  )
  liderados: HistorialMiembro[];

  @OneToMany(
    () => HistorialMiembro,
    (historial_miembro) => historial_miembro.supervisor,
  )
  supervisados: HistorialMiembro[];

  @CreateDateColumn()
  creado_en: Timestamp;

  @UpdateDateColumn()
  modificado_en: Timestamp;

  @DeleteDateColumn()
  eliminado_en: Timestamp;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Zona } from './zona.entity';
import { Miembro } from 'src/persona/entities';
import { Usuario } from 'src/usuarios/entities';

export enum EstadoSolicitud {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

@Entity({ schema: 'organizacion', name: 'solicitudes_transferencia' })
export class SolicitudTransferencia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Miembro, { eager: false })
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Zona, { eager: false })
  @JoinColumn({ name: 'zona_origen_id' })
  zona_origen: Zona;

  @ManyToOne(() => Zona, { eager: false })
  @JoinColumn({ name: 'zona_destino_id' })
  zona_destino: Zona;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'solicitante_id' })
  solicitante: Usuario;

  @Column({ type: 'varchar', default: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @Column({ type: 'timestamptz', nullable: true })
  aprobado_en: Date | null;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'aprobado_por_id' })
  aprobado_por: Usuario | null;
}

export interface ImportarMiembroDto {
  nombre_completo: string;
  zona_id: number;
  cedula?: string;
  telefono?: string;
  bautizado?: boolean;
  fecha_nacimiento?: string;
}

export interface ImportarMiembroResultadoItem {
  nombre_completo: string;
  cedula?: string;
  exito: boolean;
  error?: string;
  transferido?: boolean;
  omitido?: boolean;
}

export interface ImportarMiembrosResultado {
  importados: number;
  transferidos: number;
  omitidos: number;
  fallidos: number;
  detalle: ImportarMiembroResultadoItem[];
}

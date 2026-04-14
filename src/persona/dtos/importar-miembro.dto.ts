export interface ImportarMiembroDto {
  nombre_completo: string;
  zona_id: number;
  cedula?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  // Requisitos (columnas opcionales, true/si/1/ok para marcar)
  grupo_conexion?: boolean;
  primeros_pasos?: boolean;
  bautismo?: boolean;
  encuentro?: boolean;
  pos_encuentro?: boolean;
  doctrinas_1?: boolean;
  doctrinas_2?: boolean;
  entrenamiento_liderazgo?: boolean;
  liderazgo?: boolean;
  encuentro_oracion?: boolean;
  lider?: boolean;
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

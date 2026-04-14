export interface registroCompletoDto {
  nombre_completo: string;
  cedula: string;
  telefono: string;
  fecha_nacimiento: Date;
  zona_id: number;
  nombre_usuario: string;
  contrasena: string;
  transferir?: boolean;
}

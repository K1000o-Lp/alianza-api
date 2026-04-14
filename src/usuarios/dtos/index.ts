export interface crearUsuarioDto {
  nombre_usuario: string;
  contrasena: string;
  rol_nombre: string;
  miembro_id?: number;
  zona_id?: number;
}

export interface actualizarRolDto {
  rol_id: number;
}

export interface resetContrasenaDto {
  nueva_contrasena: string;
}

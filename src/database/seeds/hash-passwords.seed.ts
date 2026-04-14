import { DataSource } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

/**
 * Detecta usuarios cuya contraseña no es un hash bcrypt válido
 * (los hashes de bcrypt siempre comienzan con $2b$ o $2a$)
 * y los reemplaza con el hash correspondiente.
 */
function esBcryptHash(valor: string): boolean {
  return /^\$2[ab]\$\d+\$/.test(valor);
}

export async function seedHashPasswords(dataSource: DataSource): Promise<void> {
  const usuarioRepo = dataSource.getRepository(Usuario);

  // Cargar contraseñas (no se seleccionan por defecto por seguridad)
  const usuarios = await usuarioRepo
    .createQueryBuilder('usuario')
    .select(['usuario.id', 'usuario.nombre_usuario', 'usuario.contrasena'])
    .getMany();

  let actualizados = 0;
  let omitidos = 0;

  for (const usuario of usuarios) {
    if (esBcryptHash(usuario.contrasena)) {
      omitidos++;
      continue;
    }

    const hash = await bcrypt.hash(usuario.contrasena, 10);
    await usuarioRepo.update(usuario.id, { contrasena: hash });

    console.log(`  ✓ Contraseña hasheada: ${usuario.nombre_usuario}`);
    actualizados++;
  }

  console.log(`  ✓ Contraseñas: ${actualizados} hasheadas, ${omitidos} ya eran bcrypt.`);
}

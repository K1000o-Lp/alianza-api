import { DataSource } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../usuarios/entities/rol.entity';
import { Miembro } from '../../persona/entities/miembro.entity';
import * as bcrypt from 'bcrypt';

/**
 * Convención de contraseñas:
 *   Alianza@{cedula}  — si el miembro tiene cédula
 *   Alianza@{id}      — en caso contrario
 *
 * Convención de nombre_usuario:
 *   {primer_nombre_en_minúsculas}{últimos_4_de_cédula}  — si tiene cédula
 *   {primer_nombre_en_minúsculas}{id}                   — en caso contrario
 */
function buildNombreUsuario(miembro: Miembro): string {
  const primerNombre = miembro.nombre_completo
    .split(' ')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const sufijo = miembro.cedula
    ? miembro.cedula.slice(-4)
    : String(miembro.id);

  return `${primerNombre}${sufijo}`;
}

function buildContrasena(miembro: Miembro): string {
  return `Alianza@${miembro.cedula || miembro.id}`;
}

export async function seedMiembrosUsuarios(dataSource: DataSource): Promise<void> {
  const usuarioRepo = dataSource.getRepository(Usuario);
  const rolRepo = dataSource.getRepository(Rol);
  const miembroRepo = dataSource.getRepository(Miembro);

  const rolMiembro = await rolRepo.findOne({ where: { nombre: 'miembros' } });

  if (!rolMiembro) {
    console.log('  ✗ Rol "miembros" no encontrado. Ejecuta primero el seeder de roles.');
    return;
  }

  const miembros = await miembroRepo.find();
  let creados = 0;
  let omitidos = 0;

  for (const miembro of miembros) {
    const yaExiste = await usuarioRepo.findOne({
      where: { miembro: { id: miembro.id } },
    });

    if (yaExiste) {
      omitidos++;
      continue;
    }

    let nombre_usuario = buildNombreUsuario(miembro);

    // Ensure uniqueness by appending id if conflict
    const conflict = await usuarioRepo.findOne({ where: { nombre_usuario } });
    if (conflict) {
      nombre_usuario = `${nombre_usuario}_${miembro.id}`;
    }

    const contrasenaPlain = buildContrasena(miembro);
    const hash = await bcrypt.hash(contrasenaPlain, 10);

    const usuario = usuarioRepo.create({
      nombre_usuario,
      contrasena: hash,
      rol: rolMiembro,
      miembro: { id: miembro.id },
    });

    await usuarioRepo.save(usuario);
    creados++;
  }

  console.log(`  ✓ Usuarios de miembros: ${creados} creados, ${omitidos} ya existían`);
}

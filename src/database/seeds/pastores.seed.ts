import { DataSource, Not, IsNull } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../usuarios/entities/rol.entity';

/**
 * Busca todos los usuarios que ya tienen zona_id asignado (pastores existentes)
 * y les asigna el rol 'pastores' si aún no lo tienen.
 */
export async function seedPastores(dataSource: DataSource): Promise<void> {
  const usuarioRepo = dataSource.getRepository(Usuario);
  const rolRepo = dataSource.getRepository(Rol);

  const rolPastores = await rolRepo.findOne({ where: { nombre: 'pastores' } });

  if (!rolPastores) {
    console.log('  ✗ Rol "pastores" no encontrado. Ejecuta primero el seeder de roles.');
    return;
  }

  // Usuarios con zona asignada que aún no tienen el rol pastores
  const usuariosConZona = await usuarioRepo.find({
    where: { zona: Not(IsNull()) },
    relations: ['zona', 'rol'],
  });

  if (usuariosConZona.length === 0) {
    console.log('  · No se encontraron usuarios con zona asignada.');
    return;
  }

  let actualizados = 0;
  let omitidos = 0;

  for (const usuario of usuariosConZona) {
    if (usuario.rol?.nombre === 'pastores') {
      omitidos++;
      continue;
    }

    usuario.rol = rolPastores;
    await usuarioRepo.save(usuario);
    console.log(`  ✓ Rol "pastores" asignado a: ${usuario.nombre_usuario} (zona: ${usuario.zona?.id})`);
    actualizados++;
  }

  console.log(`  ✓ Pastores: ${actualizados} actualizados, ${omitidos} ya tenían el rol.`);
}

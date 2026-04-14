import { DataSource } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../usuarios/entities/rol.entity';
import * as bcrypt from 'bcrypt';

const ADMIN_PASSWORD = 'Admin@Alianza2024';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const usuarioRepo = dataSource.getRepository(Usuario);
  const rolRepo = dataSource.getRepository(Rol);

  const existe = await usuarioRepo.findOne({ where: { nombre_usuario: 'admin' } });

  if (existe) {
    console.log('  · Usuario admin ya existe');
    return;
  }

  const rolAdmin = await rolRepo.findOne({ where: { nombre: 'admin' } });

  if (!rolAdmin) {
    console.log('  ✗ Rol admin no encontrado. Ejecuta primero el seeder de roles.');
    return;
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = usuarioRepo.create({
    nombre_usuario: 'admin',
    contrasena: hash,
    rol: rolAdmin,
  });

  await usuarioRepo.save(admin);

  console.log('  ✓ Usuario admin creado');
  console.log(`    nombre_usuario: admin`);
  console.log(`    contrasena:     ${ADMIN_PASSWORD}`);
}

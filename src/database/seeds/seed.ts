import 'reflect-metadata';
import { SeedDataSource } from './data-source';
import { seedRoles } from './roles.seed';
import { seedAdmin } from './admin.seed';
import { seedPastores } from './pastores.seed';
import { seedMiembrosUsuarios } from './miembros-usuarios.seed';
import { seedHashPasswords } from './hash-passwords.seed';

async function runSeeders() {
  console.log('Conectando a la base de datos...');

  await SeedDataSource.initialize();

  console.log('Conexión establecida.\n');

  const [target] = process.argv.slice(2);

  try {
    if (!target || target === 'roles') {
      console.log('[Seeder] Roles:');
      await seedRoles(SeedDataSource);
    }

    if (!target || target === 'admin') {
      console.log('[Seeder] Admin:');
      await seedAdmin(SeedDataSource);
    }

    if (!target || target === 'pastores') {
      console.log('[Seeder] Pastores:');
      await seedPastores(SeedDataSource);
    }

    if (!target || target === 'miembros') {
      console.log('[Seeder] Usuarios de miembros:');
      await seedMiembrosUsuarios(SeedDataSource);
    }

    if (!target || target === 'hash-passwords') {
      console.log('[Seeder] Hash de contraseñas:');
      await seedHashPasswords(SeedDataSource);
    }

    console.log('\nSeeders completados.');
  } catch (err) {
    console.error('Error durante el seeder:', err);
    process.exit(1);
  } finally {
    await SeedDataSource.destroy();
  }
}

runSeeders();

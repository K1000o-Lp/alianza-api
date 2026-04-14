import { DataSource } from 'typeorm';
import { Rol } from '../../usuarios/entities/rol.entity';

const ROLES = [
  { nombre: 'admin', descripcion: 'Acceso total al sistema' },
  { nombre: 'pastores', descripcion: 'Puede gestionar su zona, generar QR de formación y ver su membresía' },
  { nombre: 'miembros', descripcion: 'Puede escanear QR y registrar su proceso de formación' },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const rolRepo = dataSource.getRepository(Rol);

  for (const rolData of ROLES) {
    const existe = await rolRepo.findOne({ where: { nombre: rolData.nombre } });
    if (!existe) {
      await rolRepo.save(rolRepo.create(rolData));
      console.log(`  ✓ Rol creado: ${rolData.nombre}`);
    } else {
      console.log(`  · Rol ya existe: ${rolData.nombre}`);
    }
  }
}

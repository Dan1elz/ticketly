import { MikroORM } from '@mikro-orm/postgresql';
import { createMikroOrmConfig } from '../mikro-orm.config';
import { AdminSeeder } from './seeders/AdminSeeder';

// Roda antes da API na imagem de produção, onde o CLI do MikroORM não existe
async function migrate() {
  const orm = await MikroORM.init(createMikroOrmConfig());

  try {
    await orm.migrator.up();
    await orm.seeder.seed(AdminSeeder);
  } finally {
    await orm.close();
  }
}

void migrate();

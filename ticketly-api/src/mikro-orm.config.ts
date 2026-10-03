import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { Admin } from './admins/entities/admin.entity';
import { Artist } from './artists/entities/artist.entity';
import { EventLineup } from './events/entities/event-lineup.entity';
import { Event } from './events/entities/event.entity';

// Função (e não objeto pronto) pra ler o process.env só na hora de usar:
// no app, o ConfigModule carrega o .env depois que este arquivo é importado
export const createMikroOrmConfig = () =>
  defineConfig({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    entities: [Admin, Artist, Event, EventLineup],
    extensions: [Migrator, SeedManager],
    migrations: {
      path: 'dist/database/migrations',
      pathTs: 'src/database/migrations',
      snapshot: false,
    },
    seeder: {
      path: 'dist/database/seeders',
      pathTs: 'src/database/seeders',
      defaultSeeder: 'DatabaseSeeder',
    },
  });

// Usada pelo CLI (migrations e seed)
export default createMikroOrmConfig();

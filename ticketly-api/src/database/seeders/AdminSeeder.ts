import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Admin } from '../../admins/entities/admin.entity';

// Primeiro admin: sem ele ninguém loga, e toda rota de admin exige login
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@ticketly.dev';

    if (await em.count(Admin, { email })) return;

    em.persist(
      await Admin.create({
        name: 'Admin',
        email,
        password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
      }),
    );
    await em.flush();
  }
}

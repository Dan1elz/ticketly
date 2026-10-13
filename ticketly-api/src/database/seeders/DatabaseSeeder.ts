import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { AdminSeeder } from './AdminSeeder';
import { ArtistSeeder } from './ArtistSeeder';
import { EventSeeder } from './EventSeeder';
import { SectorSeeder } from './SectorSeeder';

export class DatabaseSeeder extends Seeder {
  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      AdminSeeder,
      ArtistSeeder,
      EventSeeder,
      SectorSeeder,
    ]);
  }
}

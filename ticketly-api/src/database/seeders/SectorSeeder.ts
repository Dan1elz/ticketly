import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Event } from '../../events/entities/event.entity';
import { Seat } from '../../sectors/entities/seat.entity';
import { Sector } from '../../sectors/entities/sector.entity';
import { SECTORS_BY_EVENT, type ISectorSeed } from './data/sectors.data';
import { EventSeeder } from './EventSeeder';

// Setores e assentos dos shows de exemplo. Só mexe em show sem nenhum setor:
// rodar de novo não duplica nem estraga o que o admin cadastrou
export class SectorSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [EventSeeder]);

    const events = await em.find(Event, {
      name: { $in: Object.keys(SECTORS_BY_EVENT) },
    });
    const withSectors = await em.find(
      Sector,
      { event: { $in: events } },
      { fields: ['event'] },
    );
    const eventIdsWithSectors = new Set(
      withSectors.map((sector) => sector.event.id),
    );

    for (const event of events) {
      if (eventIdsWithSectors.has(event.id)) continue;

      for (const seed of SECTORS_BY_EVENT[event.name]) {
        this.addSector(em, event, seed);
      }
    }

    await em.flush();
  }

  private addSector(em: EntityManager, event: Event, seed: ISectorSeed) {
    const sector = Sector.create(event, seed);
    const seats = sector.isSeated
      ? seed.blocks.flatMap((block) => Seat.createBlock(sector, block))
      : Seat.createGeneralAdmission(sector, { quantity: seed.quantity }, 1);

    em.persist(sector);
    em.persist(seats);
  }
}

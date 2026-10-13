import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Artist } from '../../artists/entities/artist.entity';
import { Event } from '../../events/entities/event.entity';
import { ELineupStatus } from '../../events/enums/lineup-status.enum';
import type { ILineupEntry } from '../../events/events.types';
import { ArtistSeeder } from './ArtistSeeder';
import { EVENTS, type IEventSeed } from './data/events.data';

const DEFAULT_STAGE = 'Palco Principal';

export class EventSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [ArtistSeeder]);

    const existing = await em.find(
      Event,
      { name: { $in: EVENTS.map((event) => event.name) } },
      { fields: ['name'] },
    );
    const existingNames = new Set(existing.map((event) => event.name));
    const missing = EVENTS.filter((event) => !existingNames.has(event.name));

    if (missing.length === 0) return;

    const artistNames = [
      ...new Set(missing.flatMap((event) => event.lineup.map((l) => l.artist))),
    ];
    const artists = await em.find(Artist, { name: { $in: artistNames } });
    const artistsByName = new Map(
      artists.map((artist) => [artist.name, artist]),
    );

    for (const seed of missing) {
      em.persist(this.buildEvent(seed, artistsByName));
    }

    await em.flush();
  }

  private buildEvent(seed: IEventSeed, artistsByName: Map<string, Artist>) {
    const lineup = seed.lineup.map((item, index): ILineupEntry => {
      const artist = artistsByName.get(item.artist);

      if (!artist) {
        throw new Error(
          `Show "${seed.name}": artista "${item.artist}" não existe`,
        );
      }

      return {
        artist,
        stage: item.stage ?? DEFAULT_STAGE,
        performanceType: item.performanceType,
        startTime: item.startTime,
        endTime: item.endTime,
        displayOrder: index + 1,
        status: item.status ?? ELineupStatus.CONFIRMED,
      };
    });

    // Palcos saem dos nomes usados no lineup, na ordem em que aparecem
    const stages = [...new Set(lineup.map((item) => item.stage))].map(
      (name, index) => ({ name, displayOrder: index + 1 }),
    );

    const event = Event.create(
      { name: seed.name, venue: seed.venue, startsAt: seed.startsAt },
      stages,
      lineup,
    );
    event.status = seed.status;

    return event;
  }
}

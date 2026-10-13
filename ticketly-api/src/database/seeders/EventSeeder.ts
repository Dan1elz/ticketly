import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Artist } from '../../artists/entities/artist.entity';
import { Event } from '../../events/entities/event.entity';
import { ELineupStatus } from '../../events/enums/lineup-status.enum';
import type { CreateEventDto } from '../../events/dto/create-event.dto';
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
    // Palcos saem dos nomes usados no lineup, na ordem em que aparecem
    const stages = [
      ...new Set(seed.lineup.map((item) => item.stage ?? DEFAULT_STAGE)),
    ].map((name, index) => ({
      id: randomUUID(),
      name,
      description: null,
      displayOrder: index + 1,
    }));
    const stageIds = new Map(stages.map((stage) => [stage.name, stage.id]));

    const lineup = seed.lineup.map((item, index) => {
      const artist = artistsByName.get(item.artist);
      const stageId = stageIds.get(item.stage ?? DEFAULT_STAGE);

      if (!artist || !stageId) {
        throw new Error(
          `Show "${seed.name}": artista "${item.artist}" não existe`,
        );
      }

      return {
        id: randomUUID(),
        artistId: artist.id,
        stageId,
        performanceType: item.performanceType,
        startTime: item.startTime,
        endTime: item.endTime,
        displayOrder: index + 1,
        status: item.status ?? ELineupStatus.CONFIRMED,
      };
    });

    const dto: CreateEventDto = {
      name: seed.name,
      venue: seed.venue,
      startsAt: seed.startsAt,
      stages,
      lineup,
    };
    const event = Event.create(dto);
    event.status = seed.status;

    return event;
  }
}

import { Collection, EntityRepositoryType, type Opt } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import { EventRepository } from '../events.repository';
import { EventLineup, type LineupEntry } from './event-lineup.entity';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Entity({ tableName: 'events', repository: () => EventRepository })
export class Event extends BaseEntity {
  [EntityRepositoryType]?: EventRepository;

  @Property({ type: 'string', length: 160 })
  name: string;

  @Property({ type: 'string', length: 160 })
  venue: string;

  @Property({ type: 'datetime' })
  startsAt: Date;

  @Enum({ items: () => EventStatus, nativeEnumName: 'event_status' })
  status: Opt<EventStatus> = EventStatus.DRAFT;

  @OneToMany(() => EventLineup, (lineup) => lineup.event, {
    orphanRemoval: true,
    orderBy: { displayOrder: 'asc' },
  })
  lineup = new Collection<EventLineup>(this);

  update(data: UpdateEventDto, lineup?: LineupEntry[]) {
    if (data.name !== undefined) this.name = data.name;
    if (data.venue !== undefined) this.venue = data.venue;
    if (data.startsAt !== undefined) this.startsAt = data.startsAt;
    if (data.status !== undefined) this.status = data.status;
    if (lineup !== undefined) this.setLineup(lineup);
  }

  // A lista enviada é o lineup completo: quem já estava é atualizado,
  // quem é novo entra e quem ficou de fora é apagado (orphanRemoval)
  private setLineup(entries: LineupEntry[]) {
    const current = new Map(
      this.lineup.getItems().map((item) => [item.artist.id, item]),
    );

    const sorted = entries.toSorted((a, b) => a.displayOrder - b.displayOrder);

    this.lineup.set(
      sorted.map((entry) => {
        const existing = current.get(entry.artist.id);

        if (!existing) return EventLineup.create(this, entry);

        existing.update(entry);
        return existing;
      }),
    );
  }

  static create(data: CreateEventDto, lineup: LineupEntry[]): Event {
    const event = new Event();

    event.name = data.name;
    event.venue = data.venue;
    event.startsAt = data.startsAt;
    event.setLineup(lineup);

    return event;
  }
}

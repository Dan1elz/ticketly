import { EntityRepositoryType, type Opt } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
} from '@mikro-orm/decorators/legacy';
import { Artist } from '../../artists/entities/artist.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import { EventRepository } from '../events.repository';

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

  @ManyToOne(() => Artist)
  artist: Artist;

  update(data: UpdateEventDto, artist?: Artist) {
    if (data.name !== undefined) this.name = data.name;
    if (data.venue !== undefined) this.venue = data.venue;
    if (data.startsAt !== undefined) this.startsAt = data.startsAt;
    if (data.status !== undefined) this.status = data.status;
    if (artist !== undefined) this.artist = artist;
  }

  static create(data: CreateEventDto, artist: Artist): Event {
    const event = new Event();

    event.name = data.name;
    event.venue = data.venue;
    event.startsAt = data.startsAt;
    event.artist = artist;

    return event;
  }
}

import type { Opt, Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Artist } from '../../artists/entities/artist.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import type { LineupItemDto } from '../dto/lineup-item.dto';
import { Event } from './event.entity';

export enum PerformanceType {
  HEADLINER = 'HEADLINER',
  SUPPORT = 'SUPPORT',
  DJ = 'DJ',
}

export enum LineupStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export type LineupData = Omit<LineupItemDto, 'artistId' | 'artist'>;

export interface LineupEntry extends LineupData {
  artist: Artist;
}

@Entity({ tableName: 'event_lineup' })
@Unique({ properties: ['event', 'artist'] })
export class EventLineup extends BaseEntity {
  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  @ManyToOne(() => Artist, { deleteRule: 'restrict' })
  artist: Artist;

  @Property({ type: 'string', length: 100, default: 'Main Stage' })
  stage: Opt<string> = 'Main Stage';

  @Enum({
    items: () => PerformanceType,
    nativeEnumName: 'performance_type',
    default: PerformanceType.HEADLINER,
  })
  performanceType: Opt<PerformanceType> = PerformanceType.HEADLINER;

  @Property({ type: 'datetime', nullable: true })
  startTime: Opt<Date> | null = null;

  @Property({ type: 'datetime', nullable: true })
  endTime: Opt<Date> | null = null;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  @Enum({
    items: () => LineupStatus,
    nativeEnumName: 'lineup_status',
    default: LineupStatus.CONFIRMED,
  })
  status: Opt<LineupStatus> = LineupStatus.CONFIRMED;

  update(data: LineupData) {
    this.stage = data.stage;
    this.performanceType = data.performanceType;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.displayOrder = data.displayOrder;
    this.status = data.status;
  }

  static create(event: Event, { artist, ...data }: LineupEntry): EventLineup {
    const lineup = new EventLineup();

    lineup.event = event;
    lineup.artist = artist;
    lineup.update(data);

    return lineup;
  }
}

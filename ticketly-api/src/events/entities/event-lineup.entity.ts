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
import { ELineupStatus } from '../enums/lineup-status.enum';
import { EPerformanceType } from '../enums/performance-type.enum';
import type { ILineupItemData } from '../events.types';
import { EventStage } from './event-stage.entity';
import { Event } from './event.entity';

@Entity({ tableName: 'event_lineup' })
@Unique({ properties: ['event', 'artist'] })
export class EventLineup extends BaseEntity {
  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  @ManyToOne(() => Artist, { deleteRule: 'restrict' })
  artist: Artist;

  // RESTRICT: palco com artista no lineup não pode ser apagado
  @ManyToOne(() => EventStage, { deleteRule: 'restrict' })
  stage: Rel<EventStage>;

  @Enum({
    items: () => EPerformanceType,
    nativeEnumName: 'performance_type',
    default: EPerformanceType.HEADLINER,
  })
  performanceType: Opt<EPerformanceType> = EPerformanceType.HEADLINER;

  @Property({ type: 'datetime', nullable: true })
  startTime: Opt<Date> | null = null;

  @Property({ type: 'datetime', nullable: true })
  endTime: Opt<Date> | null = null;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  @Enum({
    items: () => ELineupStatus,
    nativeEnumName: 'lineup_status',
    default: ELineupStatus.CONFIRMED,
  })
  status: Opt<ELineupStatus> = ELineupStatus.CONFIRMED;

  update(stage: EventStage, data: ILineupItemData) {
    this.stage = stage;
    this.performanceType = data.performanceType;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.displayOrder = data.displayOrder;
    this.status = data.status;
  }

  static create(
    event: Event,
    artist: Artist,
    stage: EventStage,
    data: ILineupItemData,
  ): EventLineup {
    const lineup = new EventLineup();

    lineup.event = event;
    lineup.artist = artist;
    lineup.update(stage, data);

    return lineup;
  }
}

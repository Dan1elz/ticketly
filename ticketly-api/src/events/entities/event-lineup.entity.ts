import { DeferMode, rel, type Opt, type Rel } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { Artist } from '../../artists/entities/artist.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import type { EventLineupRequestDto } from '../dto/event-lineup-request.dto';
import { ELineupStatus } from '../enums/lineup-status.enum';
import { EPerformanceType } from '../enums/performance-type.enum';
import { EventStage } from './event-stage.entity';
import { Event } from './event.entity';

@Entity({ tableName: 'event_lineup' })
// Adiado até o commit: o PATCH troca a lista inteira, e o INSERT de um item novo
// do mesmo artista pode rodar antes do DELETE do antigo
@Unique({
  properties: ['event', 'artist'],
  deferMode: DeferMode.INITIALLY_DEFERRED,
})
export class EventLineup extends BaseEntity {
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

  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  @ManyToOne(() => Artist, { deleteRule: 'restrict' })
  artist: Artist;

  // RESTRICT: palco com artista no lineup não pode ser apagado. O Event
  // atribui o palco, porque ele pode ter sido criado na mesma requisição
  @ManyToOne(() => EventStage, { deleteRule: 'restrict' })
  stage: Rel<EventStage>;

  update(data: EventLineupRequestDto) {
    this.artist = rel(Artist, data.artistId);
    this.performanceType = data.performanceType;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.displayOrder = data.displayOrder;
    this.status = data.status;
  }

  static create(data: EventLineupRequestDto): EventLineup {
    const lineup = new EventLineup();

    lineup.id = data.id;
    lineup.update(data);

    return lineup;
  }
}

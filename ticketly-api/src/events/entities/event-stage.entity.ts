import { DeferMode, type Opt, type Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import type { EventStageRequestDto } from '../dto/event-stage-request.dto';
import { Event } from './event.entity';

@Entity({ tableName: 'event_stages' })
// Adiado até o commit: trocar o palco "A" por outro "A" (id novo) no mesmo PATCH
@Unique({
  properties: ['event', 'name'],
  deferMode: DeferMode.INITIALLY_DEFERRED,
})
export class EventStage extends BaseEntity {
  @Property({ type: 'string', length: 100 })
  name: string;

  @Property({ type: 'string', length: 500, nullable: true })
  description: Opt<string> | null = null;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  // Palco só existe dentro do evento: apagou o evento, apaga os palcos
  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  update(data: EventStageRequestDto) {
    this.name = data.name;
    this.description = data.description;
    this.displayOrder = data.displayOrder;
  }

  static create(data: EventStageRequestDto): EventStage {
    const stage = new EventStage();

    stage.id = data.id;
    stage.update(data);

    return stage;
  }
}

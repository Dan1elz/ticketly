import type { Opt, Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import type { IEventStageData } from '../events.types';
import { Event } from './event.entity';

@Entity({ tableName: 'event_stages' })
@Unique({ properties: ['event', 'name'] })
export class EventStage extends BaseEntity {
  // Palco só existe dentro do evento: apagou o evento, apaga os palcos
  @ManyToOne(() => Event, { deleteRule: 'cascade' })
  event: Rel<Event>;

  @Property({ type: 'string', length: 100 })
  name: string;

  @Property({ type: 'integer', default: 1 })
  displayOrder: Opt<number> = 1;

  update(data: IEventStageData) {
    this.name = data.name;
    this.displayOrder = data.displayOrder;
  }

  static create(event: Event, data: IEventStageData): EventStage {
    const stage = new EventStage();

    stage.event = event;
    stage.update(data);

    return stage;
  }
}

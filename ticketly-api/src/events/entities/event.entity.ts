import { Collection, EntityRepositoryType, type Opt } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import type { CreateEventDto } from '../dto/create-event.dto';
import type { EventLineupRequestDto } from '../dto/event-lineup-request.dto';
import type { EventStageRequestDto } from '../dto/event-stage-request.dto';
import type { UpdateEventDto } from '../dto/update-event.dto';
import { EEventStatus } from '../enums/event-status.enum';
import {
  StageInUseException,
  StageNotFoundException,
} from '../events.exceptions';
import { EventRepository } from '../events.repository';
import { EventLineup } from './event-lineup.entity';
import { EventStage } from './event-stage.entity';

@Entity({ tableName: 'events', repository: () => EventRepository })
export class Event extends BaseEntity {
  [EntityRepositoryType]?: EventRepository;

  @Property({ type: 'string', length: 160 })
  name: string;

  @Property({ type: 'string', length: 160 })
  venue: string;

  @Property({ type: 'datetime' })
  startsAt: Date;

  @Enum({ items: () => EEventStatus, nativeEnumName: 'event_status' })
  status: Opt<EEventStatus> = EEventStatus.DRAFT;

  @OneToMany(() => EventLineup, (lineup) => lineup.event, {
    orphanRemoval: true,
    orderBy: { displayOrder: 'asc' },
  })
  lineup = new Collection<EventLineup>(this);

  @OneToMany(() => EventStage, (stage) => stage.event, {
    orphanRemoval: true,
    orderBy: { displayOrder: 'asc', name: 'asc' },
  })
  stages = new Collection<EventStage>(this);

  get isCancelled(): boolean {
    return this.status === EEventStatus.CANCELLED;
  }

  get isPublished(): boolean {
    return this.status === EEventStatus.PUBLISHED;
  }

  cancel() {
    this.status = EEventStatus.CANCELLED;
  }

  // `stages` e `lineup` são opcionais: se vierem, cada lista substitui a atual
  update(data: UpdateEventDto) {
    if (data.name !== undefined) this.name = data.name;
    if (data.venue !== undefined) this.venue = data.venue;
    if (data.startsAt !== undefined) this.startsAt = data.startsAt;
    if (data.status !== undefined) this.status = data.status;

    if (data.stages !== undefined) this.setStages(data.stages);
    if (data.lineup !== undefined) this.setLineup(data.lineup);

    if (data.stages !== undefined && data.lineup === undefined) {
      this.ensureLineupStagesExist();
    }
  }

  static create(data: CreateEventDto): Event {
    const event = new Event();

    event.name = data.name;
    event.venue = data.venue;
    event.startsAt = data.startsAt;
    event.setStages(data.stages);
    event.setLineup(data.lineup);

    return event;
  }

  private setStages(items: EventStageRequestDto[]) {
    const current = new Map(this.stages.getItems().map((s) => [s.id, s]));

    this.stages.set(
      items
        .toSorted((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => {
          const existing = current.get(item.id);

          if (!existing) return EventStage.create(item);

          existing.update(item);
          return existing;
        }),
    );
  }

  // Palcos antes do lineup: o lineup acha o palco pelo id na lista já montada
  private setLineup(items: EventLineupRequestDto[]) {
    const stages = new Map(this.stages.getItems().map((s) => [s.id, s]));
    const current = new Map(this.lineup.getItems().map((l) => [l.id, l]));

    this.lineup.set(
      items
        .toSorted((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => {
          const stage = stages.get(item.stageId);

          if (!stage) throw new StageNotFoundException();

          const lineup = current.get(item.id);

          if (lineup) lineup.update(item);

          const entry = lineup ?? EventLineup.create(item);
          entry.stage = stage;

          return entry;
        }),
    );
  }

  // Palco que saiu da lista não pode estar no lineup que continua
  private ensureLineupStagesExist() {
    const ids = new Set(this.stages.getItems().map((s) => s.id));

    if (this.lineup.getItems().some((item) => !ids.has(item.stage.id))) {
      throw new StageInUseException();
    }
  }
}

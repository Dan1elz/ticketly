import { Collection, EntityRepositoryType, type Opt } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import { EEventStatus } from '../enums/event-status.enum';
import { EventRepository } from '../events.repository';
import type {
  IEventChanges,
  IEventData,
  IEventStageData,
  ILineupEntry,
} from '../events.types';
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

  stageNames(): Set<string> {
    return new Set(this.stages.getItems().map((stage) => stage.name));
  }

  // Palcos antes do lineup: o lineup procura o palco pelo nome na lista nova
  update(
    data: IEventChanges,
    stages?: IEventStageData[],
    lineup?: ILineupEntry[],
  ) {
    if (data.name !== undefined) this.name = data.name;
    if (data.venue !== undefined) this.venue = data.venue;
    if (data.startsAt !== undefined) this.startsAt = data.startsAt;
    if (data.status !== undefined) this.status = data.status;
    if (stages !== undefined) this.setStages(stages);
    if (lineup !== undefined) this.setLineup(lineup);
  }

  private setStages(items: IEventStageData[]) {
    const current = new Map(
      this.stages.getItems().map((stage) => [stage.name, stage]),
    );

    const sorted = items.toSorted((a, b) => a.displayOrder - b.displayOrder);

    this.stages.set(
      sorted.map((item) => {
        const existing = current.get(item.name);

        if (!existing) return EventStage.create(this, item);

        existing.update(item);
        return existing;
      }),
    );
  }

  private setLineup(entries: ILineupEntry[]) {
    const current = new Map(
      this.lineup.getItems().map((item) => [item.artist.id, item]),
    );
    const stages = new Map(
      this.stages.getItems().map((stage) => [stage.name, stage]),
    );

    const sorted = entries.toSorted((a, b) => a.displayOrder - b.displayOrder);

    this.lineup.set(
      sorted.map(({ artist, stage: stageName, ...data }) => {
        const stage = stages.get(stageName);

        // Não deveria acontecer: o DTO/service já validaram o nome
        if (!stage) {
          throw new Error(`Palco "${stageName}" não existe no evento`);
        }

        const existing = current.get(artist.id);

        if (!existing) return EventLineup.create(this, artist, stage, data);

        existing.update(stage, data);
        return existing;
      }),
    );
  }

  static create(
    data: IEventData,
    stages: IEventStageData[],
    lineup: ILineupEntry[],
  ): Event {
    const event = new Event();

    event.name = data.name;
    event.venue = data.venue;
    event.startsAt = data.startsAt;
    event.setStages(stages);
    event.setLineup(lineup);

    return event;
  }
}

import { Injectable } from '@nestjs/common';
import type { EventArgs, EventSubscriber } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { StorageService } from '../storage/storage.service';
import { Artist } from './entities/artist.entity';

@Injectable()
export class ArtistImageSubscriber implements EventSubscriber<Artist> {
  constructor(
    em: EntityManager,
    private readonly storage: StorageService,
  ) {
    em.getEventManager().registerSubscriber(this);
  }

  getSubscribedEntities() {
    return [Artist];
  }

  onLoad({ entity }: EventArgs<Artist>): void {
    this.fillImageUrl(entity);
  }

  afterCreate({ entity }: EventArgs<Artist>): void {
    this.fillImageUrl(entity);
  }

  afterUpdate({ entity }: EventArgs<Artist>): void {
    this.fillImageUrl(entity);
  }

  private fillImageUrl(artist: Artist): void {
    artist.imageUrl = this.storage.getPublicUrl(artist.imageKey);
  }
}

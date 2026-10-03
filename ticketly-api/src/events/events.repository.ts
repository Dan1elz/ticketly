import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type Paginated,
  type PaginationParams,
} from '../common/repositories/base.repository';
import { Event, EventStatus } from './entities/event.entity';

export interface SearchEventsParams extends PaginationParams {
  search?: string;
  artistId?: string;
  status?: EventStatus;
}

export class EventRepository extends BaseRepository<Event> {
  findByIdWithArtist(id: string): Promise<Event | null> {
    return this.findOne({ id }, { populate: ['artist'] });
  }

  async search({
    search,
    artistId,
    status,
    page,
    perPage,
  }: SearchEventsParams): Promise<Paginated<Event>> {
    const where: FilterQuery<Event> = {};

    if (search) {
      const term = `%${search.trim()}%`;
      where.$or = [{ name: { $ilike: term } }, { venue: { $ilike: term } }];
    }

    if (artistId) {
      where.artist = artistId;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.findAndCount(where, {
      populate: ['artist'],
      orderBy: { startsAt: 'asc', id: 'asc' },
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    return { items, total };
  }
}

import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type IPaginated,
  type IPaginationParams,
} from '../common/repositories/base.repository';
import { Event } from './entities/event.entity';
import { EEventStatus } from './enums/event-status.enum';

export interface ISearchEventsParams extends IPaginationParams {
  search?: string;
  artistId?: string;
  status?: EEventStatus;
}

export class EventRepository extends BaseRepository<Event> {
  /**
   * Pega um evento pelo seu ID e popula palcos, lineup, artista e palco de cada item do lineup.
   * Lineup é a relação entre o evento e os artistas que irão se apresentar nele.
   *
   * @param id - The ID of the event to find.
   * @returns A promise that resolves to the event with its lineup and artist relations populated, or null if not found.
   */
  findByIdWithLineup(id: string): Promise<Event | null> {
    return this.findOne(
      { id },
      { populate: ['stages', 'lineup.artist', 'lineup.stage'] },
    );
  }

  async search({
    search,
    artistId,
    status,
    page,
    perPage,
  }: ISearchEventsParams): Promise<IPaginated<Event>> {
    const where: FilterQuery<Event> = {};

    if (search) {
      const term = `%${search.trim()}%`;
      where.$or = [{ name: { $ilike: term } }, { venue: { $ilike: term } }];
    }

    if (artistId) {
      where.lineup = { artist: artistId };
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.findAndCount(where, {
      populate: ['stages', 'lineup.artist', 'lineup.stage'],
      orderBy: { startsAt: 'asc', id: 'asc' },
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    return { items, total };
  }
}

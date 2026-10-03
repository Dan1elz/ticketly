import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type Paginated,
  type PaginationParams,
} from '../common/repositories/base.repository';
import { Artist } from './entities/artist.entity';

export interface SearchArtistsParams extends PaginationParams {
  search?: string;
  genre?: string;
  isActive?: boolean;
}

export class ArtistRepository extends BaseRepository<Artist> {
  search({
    search,
    genre,
    isActive,
    ...pagination
  }: SearchArtistsParams): Promise<Paginated<Artist>> {
    const where: FilterQuery<Artist> = {};

    if (search) {
      const term = `%${search.trim()}%`;
      where.$or = [{ name: { $ilike: term } }, { legalName: { $ilike: term } }];
    }

    if (genre) {
      where.genre = { $ilike: genre };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.paginate(where, pagination);
  }
}

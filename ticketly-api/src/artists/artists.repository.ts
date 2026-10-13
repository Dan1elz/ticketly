import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type IPaginated,
} from '../common/repositories/base.repository';
import type { ListArtistsQueryDto } from './dto/list-artists-query.dto';
import { Artist } from './entities/artist.entity';

export class ArtistRepository extends BaseRepository<Artist> {
  search({
    search,
    genre,
    isActive,
    ...pagination
  }: ListArtistsQueryDto): Promise<IPaginated<Artist>> {
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

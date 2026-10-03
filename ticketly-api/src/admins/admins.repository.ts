import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type Paginated,
  type PaginationParams,
} from '../common/repositories/base.repository';
import { Admin } from './entities/admin.entity';

export interface SearchAdminsParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}

/**
 * O genérico (findOne, exists, paginate...) vem do BaseRepository.
 * Aqui fica só o que é específico de admin.
 */
export class AdminRepository extends BaseRepository<Admin> {
  search({
    search,
    isActive,
    ...pagination
  }: SearchAdminsParams): Promise<Paginated<Admin>> {
    const where: FilterQuery<Admin> = {};

    if (search) {
      const term = `%${search.trim()}%`;
      where.$or = [{ name: { $ilike: term } }, { email: { $ilike: term } }];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.paginate(where, pagination);
  }
}

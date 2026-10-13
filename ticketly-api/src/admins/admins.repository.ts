import type { FilterQuery } from '@mikro-orm/postgresql';
import {
  BaseRepository,
  type IPaginated,
  type IPaginationParams,
} from '../common/repositories/base.repository';
import { Admin } from './entities/admin.entity';

export interface ISearchAdminsParams extends IPaginationParams {
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
  }: ISearchAdminsParams): Promise<IPaginated<Admin>> {
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

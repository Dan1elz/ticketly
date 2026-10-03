import {
  EntityRepository,
  type FilterQuery,
  type OrderDefinition,
} from '@mikro-orm/postgresql';
import type { BaseEntity } from '../entities/base.entity';

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export abstract class BaseRepository<
  T extends BaseEntity,
> extends EntityRepository<T> {
  findById(id: string): Promise<T | null> {
    return this.findOne({ id } as FilterQuery<T>);
  }

  async exists(where: FilterQuery<T>): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  async paginate(
    where: FilterQuery<T>,
    { page, perPage }: PaginationParams,
    orderBy?: OrderDefinition<T>,
  ): Promise<Paginated<T>> {
    const [items, total] = await this.findAndCount(where, {
      orderBy:
        orderBy ?? ({ createdAt: 'desc', id: 'asc' } as OrderDefinition<T>),
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    return { items, total };
  }

  add(entity: T | T[]): void {
    this.em.persist(entity);
  }

  remove(entity: T | T[]): void {
    this.em.remove(entity);
  }

  saveChanges(): Promise<void> {
    return this.em.flush();
  }
}

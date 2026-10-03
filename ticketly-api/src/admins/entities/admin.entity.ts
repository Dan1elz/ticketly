import { EntityRepositoryType, type Hidden, type Opt } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/entities/base.entity';
import { AdminRepository } from '../admins.repository';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { hash } from 'bcrypt';

const BCRYPT_ROUNDS = 10;

@Entity({ tableName: 'admin_users', repository: () => AdminRepository })
export class Admin extends BaseEntity {
  [EntityRepositoryType]?: AdminRepository;

  @Property({ type: 'string', length: 120 })
  name: string;

  @Property({ type: 'string', length: 255, unique: true })
  email: string;

  @Property({ type: 'string', hidden: true })
  password: Hidden<string>;

  @Property({ type: 'boolean', default: true })
  isActive: Opt<boolean> = true;

  @Property({ type: 'datetime', nullable: true })
  lastLoginAt: Opt<Date> | null = null;

  update(data: UpdateAdminDto) {
    if (data.name !== undefined) this.name = data.name;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }

  static async create(data: CreateAdminDto): Promise<Admin> {
    const admin = new Admin();

    admin.name = data.name;
    admin.email = data.email;
    admin.password = await hash(data.password, BCRYPT_ROUNDS);

    return admin;
  }
}

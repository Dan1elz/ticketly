import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UniqueConstraintViolationException,
  type FilterQuery,
} from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';

import type { Paginated } from '../common/repositories/base.repository';
import { AdminRepository } from './admins.repository';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins-query.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: AdminRepository,
  ) {}

  async create(dto: CreateAdminDto): Promise<Admin> {
    await this.adminRepository
      .find({ email: dto.email })
      .then((existingAdmin) => {
        if (existingAdmin.length > 0) {
          throw new ConflictException('E-mail já cadastrado');
        }
      });

    const admin = await Admin.create(dto);

    this.adminRepository.add(admin);
    await this.saveChanges();

    return admin;
  }

  findAll(query: ListAdminsQueryDto): Promise<Paginated<Admin>> {
    return this.adminRepository.search(query);
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findById(id);

    if (!admin) {
      throw new NotFoundException('Admin não encontrado');
    }

    return admin;
  }

  async update(id: string, dto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    admin.update(dto);

    await this.saveChanges();

    return admin;
  }

  async remove(id: string): Promise<void> {
    const admin = await this.findOne(id);

    this.adminRepository.remove(admin);
    await this.saveChanges();
  }

  // Duas requisições com o mesmo e-mail ao mesmo tempo passam no
  // ensureEmailAvailable; o unique do banco barra a segunda aqui
  private async saveChanges(): Promise<void> {
    try {
      await this.adminRepository.saveChanges();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }
}

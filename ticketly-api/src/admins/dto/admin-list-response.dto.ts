import { ApiProperty } from '@nestjs/swagger';
import type { Paginated } from '../../common/repositories/base.repository';
import { Admin } from '../entities/admin.entity';
import { AdminResponseDto } from './admin-response.dto';

export class AdminListResponseDto {
  @ApiProperty({ type: [AdminResponseDto] })
  items: AdminResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  static fromPaginated({
    items,
    total,
  }: Paginated<Admin>): AdminListResponseDto {
    const dto = new AdminListResponseDto();
    dto.items = items.map((admin) => AdminResponseDto.fromEntity(admin));
    dto.total = total;
    return dto;
  }
}

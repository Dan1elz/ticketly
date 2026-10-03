import { ApiProperty } from '@nestjs/swagger';
import { Admin } from '../entities/admin.entity';

/**
 * O que a API devolve sobre um admin. É o "contrato" com o front:
 * se a entidade mudar, só o fromEntity() muda, a resposta continua igual.
 */
export class AdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Daniel Zanni' })
  name: string;

  @ApiProperty({ example: 'daniel@ticketly.dev' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: Date, nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(data: Partial<AdminResponseDto> = {}) {
    Object.assign(this, data);
  }

  static fromEntity(admin: Admin): AdminResponseDto {
    return new AdminResponseDto({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt ?? null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  }
}

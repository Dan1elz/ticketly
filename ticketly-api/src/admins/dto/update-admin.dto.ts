import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';
import { Transform } from 'class-transformer';

/**
 * Body do PATCH /admins/:id.
 * PartialType copia os campos do CreateAdminDto (com as validações) e deixa
 * todos opcionais: manda só o que quer mudar.
 */
export class UpdateAdminDto extends PartialType(CreateAdminDto) {
  @ApiProperty({ example: 'Daniel Zanni', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser true ou false' })
  isActive: boolean;
}

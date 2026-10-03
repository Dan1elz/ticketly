import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListAdminsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca no nome ou e-mail' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  // Query string sempre chega como texto: "true"/"false" -> boolean
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'isActive deve ser true ou false' })
  isActive?: boolean;
}

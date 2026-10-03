import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Mesma regra do validatePassword do front: maiúscula, minúscula, número e símbolo
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

/**
 * Body do POST /admins. O ValidationPipe valida isso ANTES de chegar no
 * controller: se algo falhar, a API já responde 400 com as mensagens.
 */
export class CreateAdminDto {
  @ApiProperty({ example: 'Daniel Zanni', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres' })
  name: string;

  @ApiProperty({ example: 'daniel@ticketly.dev' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(255, { message: 'E-mail deve ter no máximo 255 caracteres' })
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @MaxLength(50, { message: 'A senha deve ter no máximo 50 caracteres' })
  @Matches(STRONG_PASSWORD, {
    message:
      'A senha deve conter letra maiúscula, letra minúscula, número e símbolo',
  })
  password: string;
}

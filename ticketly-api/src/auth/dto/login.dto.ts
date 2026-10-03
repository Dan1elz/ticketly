import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { emailSchema } from '../../common/zod/schemas';

const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória')
    .meta({ example: 'Senha@123' }),
});

export class LoginDto extends createZodDto(loginSchema) {}

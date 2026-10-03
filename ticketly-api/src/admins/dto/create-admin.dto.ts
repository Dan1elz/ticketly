import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { emailSchema, strongPasswordSchema } from '../../common/zod/schemas';

export const createAdminSchema = z.strictObject({
  name: z
    .string({ error: 'Nome é obrigatório' })
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(120, 'Nome deve ter no máximo 120 caracteres')
    .meta({ example: 'Daniel Zanni' }),
  email: emailSchema,
  password: strongPasswordSchema,
});

export class CreateAdminDto extends createZodDto(createAdminSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/zod/schemas';

const listAdminsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(255)
    .optional()
    .meta({ description: 'Busca no nome ou e-mail' }),
  isActive: z.stringbool().optional(),
});

export class ListAdminsQueryDto extends createZodDto(listAdminsQuerySchema) {}

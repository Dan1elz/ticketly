import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/zod/schemas';

const listArtistsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(255)
    .optional()
    .meta({ description: 'Busca no nome ou nome civil' }),
  genre: z.string().trim().max(50).optional(),
  isActive: z.stringbool().optional(),
});

export class ListArtistsQueryDto extends createZodDto(listArtistsQuerySchema) {}

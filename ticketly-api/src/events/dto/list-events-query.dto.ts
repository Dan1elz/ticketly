import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/zod/schemas';
import { EventStatus } from '../entities/event.entity';

const listEventsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(255)
    .optional()
    .meta({ description: 'Busca no nome ou local' }),
  artistId: z.uuid().optional(),
  status: z.enum(EventStatus).optional(),
});

export class ListEventsQueryDto extends createZodDto(listEventsQuerySchema) {}

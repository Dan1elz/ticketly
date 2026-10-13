import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/zod/schemas';
import { EEventStatus } from '../enums/event-status.enum';

const listEventsQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(255)
    .optional()
    .meta({ description: 'Busca no nome ou local' }),
  artistId: z.uuid().optional(),
  status: z.enum(EEventStatus).optional(),
});

export class ListEventsQueryDto extends createZodDto(listEventsQuerySchema) {}

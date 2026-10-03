import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { EventStatus } from '../entities/event.entity';

export const eventResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  venue: z.string(),
  startsAt: dateTimeSchema,
  status: z.enum(EventStatus),
  artist: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class EventResponseDto extends createZodDto(eventResponseSchema, {
  codec: true,
}) {}

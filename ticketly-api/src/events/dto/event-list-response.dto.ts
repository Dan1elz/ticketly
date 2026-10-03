import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { eventResponseSchema } from './event-response.dto';

const eventListResponseSchema = z.object({
  items: z.array(eventResponseSchema),
  total: z.number().int(),
});

export class EventListResponseDto extends createZodDto(
  eventListResponseSchema,
  { codec: true },
) {}

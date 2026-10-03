import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EventStatus } from '../entities/event.entity';
import { createEventSchema } from './create-event.dto';

export const updateEventSchema = createEventSchema.partial().extend({
  status: z
    .enum(EventStatus, { error: 'Status deve ser DRAFT ou PUBLISHED' })
    .optional(),
});

export class UpdateEventDto extends createZodDto(updateEventSchema) {}

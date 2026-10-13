import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { EEventStatus } from '../enums/event-status.enum';
import {
  eventBaseSchema,
  lineupStageError,
  lineupStagesMatch,
} from './create-event.dto';

// `stages` e `lineup` são opcionais; se vierem, cada lista substitui a atual
// inteira. Se vier só um dos dois, o service confere contra o que está no banco
export const updateEventSchema = eventBaseSchema
  .partial()
  .extend({
    // CANCELLED fica de fora: cancelar é POST /events/:id/cancel
    status: z
      .enum([EEventStatus.DRAFT, EEventStatus.PUBLISHED], {
        error: 'Status deve ser DRAFT ou PUBLISHED',
      })
      .optional(),
  })
  .refine(lineupStagesMatch, lineupStageError);

export class UpdateEventDto extends createZodDto(updateEventSchema) {}

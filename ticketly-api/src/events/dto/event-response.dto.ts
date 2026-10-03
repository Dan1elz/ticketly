import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { collectionSchema, dateTimeSchema } from '../../common/zod/schemas';
import { LineupStatus, PerformanceType } from '../entities/event-lineup.entity';
import { EventStatus } from '../entities/event.entity';

const lineupResponseSchema = z.object({
  id: z.uuid(),
  stage: z.string(),
  performanceType: z.enum(PerformanceType),
  startTime: dateTimeSchema.nullable(),
  endTime: dateTimeSchema.nullable(),
  displayOrder: z.number().int(),
  status: z.enum(LineupStatus),
  artist: z.object({
    id: z.uuid(),
    name: z.string(),
    imageUrl: z.string(),
  }),
});

export const eventResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  venue: z.string(),
  startsAt: dateTimeSchema,
  status: z.enum(EventStatus),
  lineup: collectionSchema(lineupResponseSchema),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class EventResponseDto extends createZodDto(eventResponseSchema, {
  codec: true,
}) {}

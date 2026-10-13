import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { collectionSchema, dateTimeSchema } from '../../common/zod/schemas';
import { ELineupStatus } from '../enums/lineup-status.enum';
import { EPerformanceType } from '../enums/performance-type.enum';
import { EEventStatus } from '../enums/event-status.enum';

const stageResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  displayOrder: z.number().int(),
});

const lineupResponseSchema = z.object({
  id: z.uuid(),
  stage: stageResponseSchema.pick({ id: true, name: true }),
  performanceType: z.enum(EPerformanceType),
  startTime: dateTimeSchema.nullable(),
  endTime: dateTimeSchema.nullable(),
  displayOrder: z.number().int(),
  status: z.enum(ELineupStatus),
  artist: z.object({
    id: z.uuid(),
    name: z.string(),
    imageKey: z.string(),
    imageUrl: z.url(),
  }),
});

export const eventResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  venue: z.string(),
  startsAt: dateTimeSchema,
  status: z.enum(EEventStatus),
  stages: collectionSchema(stageResponseSchema),
  lineup: collectionSchema(lineupResponseSchema),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class EventResponseDto extends createZodDto(eventResponseSchema, {
  codec: true,
}) {}

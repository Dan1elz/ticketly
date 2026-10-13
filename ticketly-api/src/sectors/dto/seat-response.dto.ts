import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { ESeatStatus } from '../enums/seat-status.enum';

export const seatResponseSchema = z.object({
  id: z.uuid(),
  row: z.string().nullable(),
  number: z.number().int(),
  gridRow: z.number().int().nullable(),
  gridColumn: z.number().int().nullable(),
  isAccessible: z.boolean(),
  status: z.enum(ESeatStatus),
  statusNote: z.string().nullable(),
  statusChangedAt: dateTimeSchema.nullable(),
  statusChangedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
});

export class SeatResponseDto extends createZodDto(seatResponseSchema, {
  codec: true,
}) {}

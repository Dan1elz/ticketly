import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { ESectorType } from '../enums/sector-type.enum';

const seatCountsSchema = z.object({
  AVAILABLE: z.number().int(),
  RESERVED: z.number().int(),
  SOLD: z.number().int(),
  BLOCKED: z.number().int(),
  CANCELLED: z.number().int(),
  total: z.number().int(),
});

export const sectorResponseSchema = z.object({
  id: z.uuid(),
  event: z.object({ id: z.uuid() }),
  name: z.string(),
  type: z.enum(ESectorType),
  description: z.string().nullable(),
  priceCents: z.number().int(),
  color: z.string(),
  displayOrder: z.number().int(),
  maxPerOrder: z.number().int().nullable(),
  seatCounts: seatCountsSchema.meta({
    description: 'Quantidade de assentos em cada status',
  }),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class SectorResponseDto extends createZodDto(sectorResponseSchema, {
  codec: true,
}) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { lineupSchema } from './lineup-item.dto';

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`);

export const createEventSchema = z.strictObject({
  name: requiredText('Nome', 160).meta({
    example: 'Anitta - Turnê Funk Generation',
  }),
  venue: requiredText('Local', 160).meta({ example: 'Allianz Parque' }),
  startsAt: dateTimeSchema.meta({ example: '2026-12-20T21:00:00.000Z' }),
  lineup: lineupSchema,
});

export class CreateEventDto extends createZodDto(createEventSchema) {}

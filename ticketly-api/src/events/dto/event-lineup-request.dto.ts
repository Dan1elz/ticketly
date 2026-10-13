import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { ELineupStatus } from '../enums/lineup-status.enum';
import { EPerformanceType } from '../enums/performance-type.enum';

export const eventLineupRequestSchema = z
  .strictObject({
    id: z
      .uuid({ error: 'Id do item do lineup inválido' })
      .meta({ description: 'Gerado pelo front' }),
    artistId: z.uuid({ error: 'Artista inválido' }),
    stageId: z
      .uuid({ error: 'Palco inválido' })
      .meta({ description: 'Id de um dos palcos do evento' }),
    performanceType: z
      .enum(EPerformanceType)
      .default(EPerformanceType.HEADLINER),
    startTime: dateTimeSchema.nullable().default(null),
    endTime: dateTimeSchema.nullable().default(null),
    displayOrder: z.number().int().min(1).default(1),
    status: z.enum(ELineupStatus).default(ELineupStatus.CONFIRMED),
  })
  .refine(
    ({ startTime, endTime }) => !startTime || !endTime || endTime > startTime,
    {
      error: 'Fim da apresentação deve ser depois do início',
      path: ['endTime'],
    },
  );

export class EventLineupRequestDto extends createZodDto(
  eventLineupRequestSchema,
) {}

export const eventLineupSchema = z
  .array(eventLineupRequestSchema, { error: 'Lineup é obrigatório' })
  .min(1, 'Informe ao menos um artista')
  .refine((items) => new Set(items.map((i) => i.id)).size === items.length, {
    error: 'Id de item do lineup repetido',
  })
  .refine(
    (items) => new Set(items.map((i) => i.artistId)).size === items.length,
    { error: 'Artista repetido no lineup' },
  );

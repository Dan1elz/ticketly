import { z } from 'zod';
import { createArtistSchema } from '../../artists/dto/create-artist.dto';
import { dateTimeSchema } from '../../common/zod/schemas';
import { LineupStatus, PerformanceType } from '../entities/event-lineup.entity';

export const lineupItemSchema = z
  .strictObject({
    artistId: z
      .uuid({ error: 'Artista inválido' })
      .optional()
      .meta({ description: 'Artista já cadastrado' }),
    artist: createArtistSchema
      .optional()
      .meta({ description: 'Artista novo, cadastrado junto com o evento' }),
    stage: z
      .string()
      .trim()
      .min(1, 'Palco é obrigatório')
      .max(100, 'Palco deve ter no máximo 100 caracteres')
      .default('Main Stage'),
    performanceType: z.enum(PerformanceType).default(PerformanceType.HEADLINER),
    startTime: dateTimeSchema.nullable().default(null),
    endTime: dateTimeSchema.nullable().default(null),
    displayOrder: z.number().int().min(1).default(1),
    status: z.enum(LineupStatus).default(LineupStatus.CONFIRMED),
  })
  .refine((item) => !item.artistId !== !item.artist, {
    error: 'Informe artistId (artista existente) ou artist (artista novo)',
    path: ['artistId'],
  })
  .refine(
    ({ startTime, endTime }) => !startTime || !endTime || endTime > startTime,
    {
      error: 'Fim da apresentação deve ser depois do início',
      path: ['endTime'],
    },
  );

export type LineupItemDto = z.output<typeof lineupItemSchema>;

export const lineupSchema = z
  .array(lineupItemSchema, { error: 'Lineup é obrigatório' })
  .min(1, 'Informe ao menos um artista')
  .refine(
    (items) => {
      const ids = items.flatMap((item) => item.artistId ?? []);
      return new Set(ids).size === ids.length;
    },
    { error: 'Artista repetido no lineup' },
  );

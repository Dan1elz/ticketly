import { z } from 'zod';
import { createArtistSchema } from '../../artists/dto/create-artist.dto';
import { dateTimeSchema } from '../../common/zod/schemas';
import { ELineupStatus } from '../enums/lineup-status.enum';
import { EPerformanceType } from '../enums/performance-type.enum';
import { stageNameSchema } from './stage-item.dto';

export const lineupItemSchema = z
  .strictObject({
    artistId: z
      .uuid({ error: 'Artista inválido' })
      .optional()
      .meta({ description: 'Artista já cadastrado' }),
    artist: createArtistSchema
      .optional()
      .meta({ description: 'Artista novo, cadastrado junto com o evento' }),
    stage: stageNameSchema.meta({
      description: 'Nome de um dos palcos do evento',
      example: 'Palco Principal',
    }),
    performanceType: z
      .enum(EPerformanceType)
      .default(EPerformanceType.HEADLINER),
    startTime: dateTimeSchema.nullable().default(null),
    endTime: dateTimeSchema.nullable().default(null),
    displayOrder: z.number().int().min(1).default(1),
    status: z.enum(ELineupStatus).default(ELineupStatus.CONFIRMED),
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

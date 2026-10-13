import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { lineupSchema } from './lineup-item.dto';
import { stagesSchema } from './stage-item.dto';

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .max(max, `${label} deve ter no máximo ${max} caracteres`);

// Sem refine aqui: o update usa .partial(), que não funciona em schema refinado
export const eventBaseSchema = z.strictObject({
  name: requiredText('Nome', 160).meta({
    example: 'Anitta - Turnê Funk Generation',
  }),
  venue: requiredText('Local', 160).meta({ example: 'Allianz Parque' }),
  startsAt: dateTimeSchema.meta({ example: '2026-12-20T21:00:00.000Z' }),
  stages: stagesSchema,
  lineup: lineupSchema,
});

// Cada item do lineup precisa apontar pra um palco da lista `stages`.
// Se só uma das listas vier (PATCH), quem confere é o service, com o banco
export const lineupStagesMatch = ({
  stages,
  lineup,
}: {
  stages?: { name: string }[];
  lineup?: { stage: string }[];
}) => {
  if (!stages || !lineup) return true;

  const names = new Set(stages.map((stage) => stage.name));
  return lineup.every((item) => names.has(item.stage));
};

export const lineupStageError = {
  error: 'Palco do lineup não está na lista de palcos do evento',
  path: ['lineup'],
};

export const createEventSchema = eventBaseSchema.refine(
  lineupStagesMatch,
  lineupStageError,
);

export class CreateEventDto extends createZodDto(createEventSchema) {}

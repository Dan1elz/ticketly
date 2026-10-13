import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';
import { eventLineupSchema } from './event-lineup-request.dto';
import { eventStagesSchema } from './event-stage-request.dto';

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
  stages: eventStagesSchema,
  lineup: eventLineupSchema,
});

// Com as duas listas no payload, cada item do lineup tem que apontar pra um
// palco da lista `stages`. Se só uma vier (PATCH), quem confere é o Event
export const lineupStagesMatch = ({
  stages,
  lineup,
}: {
  stages?: { id: string }[];
  lineup?: { stageId: string }[];
}) => {
  if (!stages || !lineup) return true;

  const ids = new Set(stages.map((stage) => stage.id));
  return lineup.every((item) => ids.has(item.stageId));
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

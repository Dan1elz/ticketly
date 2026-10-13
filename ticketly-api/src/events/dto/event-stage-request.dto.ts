import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const eventStageRequestSchema = z.strictObject({
  id: z
    .uuid({ error: 'Id do palco inválido' })
    .meta({ description: 'Gerado pelo front' }),
  name: z
    .string({ error: 'Palco é obrigatório' })
    .trim()
    .min(1, 'Palco é obrigatório')
    .max(100, 'Palco deve ter no máximo 100 caracteres')
    .meta({ example: 'Palco Principal' }),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .default(null)
    .meta({ example: 'Palco principal, de frente para a pista' }),
  displayOrder: z.number().int().min(1).default(1),
});

export class EventStageRequestDto extends createZodDto(
  eventStageRequestSchema,
) {}

export const eventStagesSchema = z
  .array(eventStageRequestSchema, { error: 'Palcos são obrigatórios' })
  .min(1, 'Informe ao menos um palco')
  .refine((items) => new Set(items.map((i) => i.id)).size === items.length, {
    error: 'Id de palco repetido',
  })
  .refine((items) => new Set(items.map((i) => i.name)).size === items.length, {
    error: 'Palco repetido no evento',
  });

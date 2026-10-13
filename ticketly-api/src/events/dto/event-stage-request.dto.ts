import { z } from 'zod';

export const stageNameSchema = z
  .string({ error: 'Palco é obrigatório' })
  .trim()
  .min(1, 'Palco é obrigatório')
  .max(100, 'Palco deve ter no máximo 100 caracteres');

export const stageItemSchema = z.strictObject({
  name: stageNameSchema.meta({ example: 'Palco Principal' }),
  displayOrder: z.number().int().min(1).default(1),
});

export type StageItemDto = z.output<typeof stageItemSchema>;

// O nome identifica o palco dentro do evento (o lineup aponta pra ele pelo nome)
export const stagesSchema = z
  .array(stageItemSchema, { error: 'Palcos são obrigatórios' })
  .min(1, 'Informe ao menos um palco')
  .refine(
    (items) => new Set(items.map((item) => item.name)).size === items.length,
    { error: 'Palco repetido no evento' },
  );

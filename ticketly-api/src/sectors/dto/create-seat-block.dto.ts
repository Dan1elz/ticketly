import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MAX_SEATS_PER_BLOCK = 2000;

// Um bloco é um retângulo da grade: cada fileira vira uma linha da grade e
// cada número uma coluna. Ex: rows ["A","B"], números 1..10, começando na
// linha 1 e coluna 3 da grade → A1 em (1,3), A10 em (1,12), B1 em (2,3).
// Corredor = deixar linhas/colunas vazias entre um bloco e outro
export const createSeatBlockSchema = z
  .strictObject({
    rows: z
      .array(
        z
          .string()
          .trim()
          .toUpperCase()
          .min(1, 'Fileira não pode ser vazia')
          .max(10, 'Fileira deve ter no máximo 10 caracteres'),
        { error: 'Fileiras são obrigatórias' },
      )
      .min(1, 'Informe ao menos uma fileira')
      .max(100, 'Informe no máximo 100 fileiras por bloco')
      .refine((rows) => new Set(rows).size === rows.length, {
        error: 'Fileira repetida no bloco',
      })
      .meta({ example: ['A', 'B', 'C'] }),
    numberStart: z
      .number({ error: 'Número inicial é obrigatório' })
      .int()
      .min(1, 'Número inicial deve ser maior que zero')
      .meta({ example: 1 }),
    numberEnd: z
      .number({ error: 'Número final é obrigatório' })
      .int()
      .min(1, 'Número final deve ser maior que zero')
      .meta({ example: 20 }),
    gridRowStart: z
      .number()
      .int()
      .min(1)
      .default(1)
      .meta({ description: 'Linha da grade da primeira fileira' }),
    gridColumnStart: z
      .number()
      .int()
      .min(1)
      .default(1)
      .meta({ description: 'Coluna da grade do número inicial' }),
    isAccessible: z.boolean().default(false),
  })
  .refine(({ numberStart, numberEnd }) => numberEnd >= numberStart, {
    error: 'Número final deve ser maior ou igual ao inicial',
    path: ['numberEnd'],
  })
  .refine(
    ({ rows, numberStart, numberEnd }) =>
      rows.length * (numberEnd - numberStart + 1) <= MAX_SEATS_PER_BLOCK,
    { error: `Bloco pode ter no máximo ${MAX_SEATS_PER_BLOCK} assentos` },
  );

export class CreateSeatBlockDto extends createZodDto(createSeatBlockSchema) {}

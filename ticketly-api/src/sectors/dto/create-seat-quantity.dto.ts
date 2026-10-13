import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Pista: os números continuam de onde parou (já tem 500 → cria 501, 502...)
export const createSeatQuantitySchema = z.strictObject({
  quantity: z
    .number({ error: 'Quantidade é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade deve ser maior que zero')
    .max(10000, 'Quantidade deve ser no máximo 10000 por vez')
    .meta({ example: 500 }),
});

export class CreateSeatQuantityDto extends createZodDto(
  createSeatQuantitySchema,
) {}

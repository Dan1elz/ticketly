import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ESectorType } from '../enums/sector-type.enum';

// Campos soltos: o create e o update montam o objeto deles com os mesmos campos
export const sectorNameSchema = z
  .string({ error: 'Nome é obrigatório' })
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .meta({ example: 'Cadeira Superior' });

export const sectorDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Descrição deve ter no máximo 500 caracteres')
  .nullable()
  .meta({ example: 'Visão frontal do palco' });

export const priceCentsSchema = z
  .number({ error: 'Preço é obrigatório' })
  .int('Preço deve ser em centavos (número inteiro)')
  .min(0, 'Preço não pode ser negativo')
  .meta({ description: 'Preço em centavos', example: 15000 });

export const sectorColorSchema = z
  .string({ error: 'Cor é obrigatória' })
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB')
  .transform((color) => color.toUpperCase())
  .meta({ example: '#7C3AED' });

export const sectorDisplayOrderSchema = z.number().int().min(1);

export const maxPerOrderSchema = z
  .number()
  .int()
  .min(1, 'Máximo por pedido deve ser maior que zero')
  .nullable()
  .meta({
    description: 'Máximo de ingressos do setor por pedido (null = sem limite)',
    example: 4,
  });

export const createSectorSchema = z.strictObject({
  name: sectorNameSchema,
  type: z
    .enum(ESectorType, { error: 'Tipo deve ser SEATED ou GENERAL_ADMISSION' })
    .meta({
      description:
        'SEATED: lugar marcado (grade). GENERAL_ADMISSION: pista (só quantidade)',
    }),
  description: sectorDescriptionSchema.default(null),
  priceCents: priceCentsSchema,
  color: sectorColorSchema,
  displayOrder: sectorDisplayOrderSchema.default(1),
  maxPerOrder: maxPerOrderSchema.default(null),
});

export class CreateSectorDto extends createZodDto(createSectorSchema) {}

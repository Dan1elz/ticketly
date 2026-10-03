import { z } from 'zod';

z.config(z.locales.pt());

export const dateTimeSchema = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

// trim/lowercase ANTES de validar o formato: "  Daniel@X.com " vira "daniel@x.com"
export const emailSchema = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({ error: 'E-mail inválido' })
      .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  )
  .meta({ example: 'daniel@ticketly.dev' });

// Mesma regra do validatePassword do front
export const strongPasswordSchema = z
  .string({ error: 'Senha é obrigatória' })
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(50, 'A senha deve ter no máximo 50 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    'A senha deve conter letra maiúscula, letra minúscula, número e símbolo',
  )
  .meta({ example: 'Senha@123' });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Bloquear e cancelar exigem o motivo
export const seatNoteSchema = z.strictObject({
  note: z
    .string({ error: 'Observação é obrigatória' })
    .trim()
    .min(1, 'Observação é obrigatória')
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .meta({ example: 'Reservado para a produção' }),
});

export class SeatNoteDto extends createZodDto(seatNoteSchema) {}

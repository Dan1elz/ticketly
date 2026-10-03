import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Formato padrão de erro do Nest (o que o ApiError do front lê)
const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string(),
});

export class ErrorResponseDto extends createZodDto(errorResponseSchema) {}

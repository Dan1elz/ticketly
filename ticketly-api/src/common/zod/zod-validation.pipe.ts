import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

// Mantém o formato padrão de erro do Nest ({ statusCode, message: string[] }),
// que é o que o ApiError do front sabe ler
export const ZodValidationPipe: ReturnType<typeof createZodValidationPipe> =
  createZodValidationPipe({
    createValidationException: (error: unknown) =>
      new BadRequestException(
        error instanceof ZodError
          ? error.issues.map((issue) => issue.message)
          : 'Dados inválidos',
      ),
  });

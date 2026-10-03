import {
  applyDecorators,
  HttpException,
  HttpStatus,
  type Type,
} from '@nestjs/common';
import { ApiResponse, type ApiResponseExamples } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

type ExceptionClass = Type<HttpException> & (new () => HttpException);
type ApiErrorSource = HttpStatus | ExceptionClass;
type ApiErrorEntry =
  ApiErrorSource | { error: ApiErrorSource; description: string };

const DEFAULT_DESCRIPTIONS: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Dados inválidos',
  [HttpStatus.UNAUTHORIZED]: 'Não autenticado',
  [HttpStatus.FORBIDDEN]: 'Sem permissão',
  [HttpStatus.NOT_FOUND]: 'Não encontrado',
  [HttpStatus.CONFLICT]: 'Conflito',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Não foi possível processar',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno',
};

interface ResolvedError {
  status: HttpStatus;
  name: string;
  description: string;
  example: ErrorResponseDto;
}

// HttpStatus.NOT_FOUND -> "Not Found"
function statusName(status: HttpStatus): string {
  return HttpStatus[status]
    .toLowerCase()
    .replace(
      /(^|_)(\w)/g,
      (_, sep: string, char: string) => (sep ? ' ' : '') + char.toUpperCase(),
    );
}

function resolve(entry: ApiErrorEntry): ResolvedError {
  const { error, description } =
    typeof entry === 'object'
      ? entry
      : { error: entry, description: undefined };

  if (typeof error === 'number') {
    const text =
      description ?? DEFAULT_DESCRIPTIONS[error] ?? statusName(error);

    return {
      status: error,
      name: statusName(error),
      description: text,
      example: {
        statusCode: error,
        message: error === HttpStatus.BAD_REQUEST ? [text] : text,
        error: statusName(error),
      },
    };
  }

  // Instancia a exceção só pra ler status e mensagem: a mesma que o service lança
  const exception = new error();

  return {
    status: exception.getStatus(),
    name: error.name,
    description: description ?? exception.message,
    example: exception.getResponse() as ErrorResponseDto,
  };
}

/**
 * Documenta no Swagger os erros que a rota pode devolver.
 *
 * @example
 * @ApiErrors(HttpStatus.BAD_REQUEST, AdminNotFoundException)
 * @ApiErrors({ error: AdminNotFoundException, description: 'Texto próprio' })
 */
export function ApiErrors(...entries: ApiErrorEntry[]) {
  const byStatus = new Map<HttpStatus, ResolvedError[]>();

  for (const resolved of entries.map(resolve)) {
    byStatus.set(resolved.status, [
      ...(byStatus.get(resolved.status) ?? []),
      resolved,
    ]);
  }

  // Swagger só aceita uma resposta por status: erros com o mesmo status viram
  // uma resposta só, com um exemplo pra cada
  return applyDecorators(
    ...[...byStatus].map(([status, errors]) =>
      ApiResponse({
        status,
        description: errors.map((e) => e.description).join(' | '),
        type: ErrorResponseDto,
        examples: Object.fromEntries(
          errors.map((e): [string, ApiResponseExamples] => [
            e.name,
            { summary: e.description, value: e.example },
          ]),
        ),
      }),
    ),
  );
}

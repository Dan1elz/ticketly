import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('E-mail ou senha inválidos');
  }
}

export class MissingTokenException extends UnauthorizedException {
  constructor() {
    super('Token não informado');
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Token inválido ou expirado');
  }
}

export class InvalidSessionException extends UnauthorizedException {
  constructor() {
    super('Sessão inválida');
  }
}

// Erros que qualquer rota protegida pelo guard pode devolver
export const AUTH_GUARD_ERRORS = [
  MissingTokenException,
  InvalidTokenException,
  InvalidSessionException,
];

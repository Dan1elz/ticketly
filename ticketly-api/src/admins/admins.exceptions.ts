import { ConflictException, NotFoundException } from '@nestjs/common';

export class AdminNotFoundException extends NotFoundException {
  constructor() {
    super('Admin não encontrado');
  }
}

export class AdminEmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('E-mail já cadastrado');
  }
}

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class EventNotFoundException extends NotFoundException {
  constructor() {
    super('Evento não encontrado');
  }
}

export class EventCancelledException extends ConflictException {
  constructor() {
    super('Evento cancelado não pode ser alterado');
  }
}

export class StageNotFoundException extends BadRequestException {
  constructor() {
    super('Palco do lineup não existe no evento');
  }
}

export class StageInUseException extends ConflictException {
  constructor() {
    super('Palco está no lineup do evento');
  }
}

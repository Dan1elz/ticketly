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

export class EventConflictException extends ConflictException {
  constructor() {
    super('Palco ou item do lineup já existe em outro evento ou está repetido');
  }
}

export class EventHasSectorsException extends ConflictException {
  constructor() {
    super('Evento com setores não pode ser excluído, só cancelado');
  }
}

export class EventHasActiveSeatsException extends ConflictException {
  constructor() {
    super('Evento com assentos reservados ou vendidos não pode ser cancelado');
  }
}

export class EventWithoutAvailableSeatsException extends ConflictException {
  constructor() {
    super(
      'Evento precisa de ao menos um assento disponível para ser publicado',
    );
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

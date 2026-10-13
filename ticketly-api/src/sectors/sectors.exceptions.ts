import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class SectorNotFoundException extends NotFoundException {
  constructor() {
    super('Setor não encontrado');
  }
}

export class SectorNameAlreadyExistsException extends ConflictException {
  constructor() {
    super('Já existe um setor com esse nome no evento');
  }
}

export class SectorHasSeatsException extends ConflictException {
  constructor() {
    super('Setor com assentos não pode ser excluído');
  }
}

export class SectorNotSeatedException extends BadRequestException {
  constructor() {
    super('Setor de pista: informe a quantidade de ingressos');
  }
}

export class SectorNotGeneralAdmissionException extends BadRequestException {
  constructor() {
    super('Setor de lugar marcado: gere os assentos por bloco');
  }
}

export class SeatNotFoundException extends NotFoundException {
  constructor() {
    super('Assento não encontrado');
  }
}

export class SeatPositionTakenException extends ConflictException {
  constructor() {
    super('Já existe assento nessa fileira/número ou posição da grade');
  }
}

export class SeatNotAvailableException extends ConflictException {
  constructor() {
    super('Só assento disponível pode ser bloqueado ou cancelado');
  }
}

export class SeatNotBlockedException extends ConflictException {
  constructor() {
    super('Assento não está bloqueado');
  }
}

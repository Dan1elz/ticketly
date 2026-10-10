import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class ArtistNotFoundException extends NotFoundException {
  constructor() {
    super('Artista não encontrado');
  }
}

export class ArtistInactiveException extends ConflictException {
  constructor() {
    super('Artista está desativado');
  }
}

export class ArtistInUseException extends ConflictException {
  constructor() {
    super('Artista está no lineup de algum evento');
  }
}

export class ArtistImageNotFoundException extends BadRequestException {
  constructor() {
    super('Foto não encontrada no storage. Envie a imagem novamente');
  }
}

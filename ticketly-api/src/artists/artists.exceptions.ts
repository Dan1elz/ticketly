import { ConflictException, NotFoundException } from '@nestjs/common';

export class ArtistNotFoundException extends NotFoundException {
  constructor() {
    super('Artista não encontrado');
  }
}

export class ArtistInUseException extends ConflictException {
  constructor() {
    super('Artista está no lineup de algum evento');
  }
}

import { BadRequestException } from '@nestjs/common';

export class EmptyFileException extends BadRequestException {
  constructor() {
    super('Arquivo vazio');
  }
}

export class UnsupportedFileTypeException extends BadRequestException {
  constructor(allowedExtensions: string[] = []) {
    super(
      allowedExtensions.length
        ? `Tipo de arquivo não permitido. Use: ${allowedExtensions.join(', ')}`
        : 'Tipo de arquivo não permitido',
    );
  }
}

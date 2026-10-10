import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import type { TBucket } from '../storage/storage.types';
import {
  EmptyFileException,
  UnsupportedFileTypeException,
} from './uploads.exceptions';
import {
  ALLOWED_MIME_TYPES,
  FILE_EXTENSIONS,
  type TDocumentFolder,
  type TPublicFolder,
  type TUploadFolder,
  type UploadResult,
} from './uploads.types';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async uploadPublicImage(
    file: Express.Multer.File,
    folder: TPublicFolder,
  ): Promise<UploadResult> {
    const key = await this.upload('public', folder, file);

    return { key, url: this.storage.getPublicUrl(key) };
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: TDocumentFolder,
  ): Promise<UploadResult> {
    const key = await this.upload('documents', folder, file);

    return { key, url: await this.storage.getSignedUrl('documents', key) };
  }

  private async upload<B extends TBucket>(
    bucket: B,
    folder: TUploadFolder<B>,
    file: Express.Multer.File,
  ): Promise<string> {
    this.validate(bucket, file);

    const key = `${folder}/${randomUUID()}.${FILE_EXTENSIONS[file.mimetype]}`;

    await this.storage.upload(bucket, key, file.buffer, file.mimetype);

    return key;
  }

  private validate(bucket: TBucket, file: Express.Multer.File): void {
    if (file.size === 0) {
      throw new EmptyFileException();
    }

    const allowed = ALLOWED_MIME_TYPES[bucket];

    if (!allowed.includes(file.mimetype)) {
      throw new UnsupportedFileTypeException(
        allowed.map((mimetype) => FILE_EXTENSIONS[mimetype]),
      );
    }
  }
}

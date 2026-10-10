import type { TBucket } from '../storage/storage.types';

export type TUploadFolders = {
  public: 'artists' | 'events';
  documents: 'invoices' | 'tickets';
};

export type TPublicFolder = TUploadFolders['public'];
export type TDocumentFolder = TUploadFolders['documents'];
export type TUploadFolder<B extends TBucket = TBucket> = TUploadFolders[B];

export interface UploadResult {
  key: string;
  url: string;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const FILE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

export const ALLOWED_MIME_TYPES: Record<TBucket, string[]> = {
  public: ['image/jpeg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
};

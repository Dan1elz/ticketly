import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TBucket } from './storage.types';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly signer: S3Client;
  private readonly buckets: Record<TBucket, string>;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    const base: S3ClientConfig = {
      region: config.getOrThrow<string>('S3_REGION'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      },
    };

    this.publicUrl = config.getOrThrow<string>('S3_PUBLIC_URL');

    this.client = new S3Client({
      ...base,
      endpoint: config.getOrThrow<string>('S3_ENDPOINT_URL'),
    });
    this.signer = new S3Client({ ...base, endpoint: this.publicUrl });

    this.buckets = {
      public: config.getOrThrow<string>('S3_BUCKET_PUBLIC'),
      documents: config.getOrThrow<string>('S3_BUCKET_DOCUMENTS'),
    };
  }

  async upload(
    bucket: TBucket,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.buckets[bucket],
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async download(bucket: TBucket, key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
    );

    if (!response.Body) {
      throw new Error(`Arquivo vazio: ${bucket}/${key}`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async delete(bucket: TBucket, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
    );
  }

  async exists(bucket: TBucket, key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
      );
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }

  getSignedUrl(
    bucket: TBucket,
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    return getSignedUrl(
      this.signer,
      new GetObjectCommand({ Bucket: this.buckets[bucket], Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${this.buckets.public}/${key}`;
  }
}

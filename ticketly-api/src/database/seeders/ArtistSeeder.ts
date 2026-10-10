import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { Artist } from '../../artists/entities/artist.entity';
import { StorageService } from '../../storage/storage.service';
import {
  ALLOWED_MIME_TYPES,
  FILE_EXTENSIONS,
} from '../../uploads/uploads.types';
import { ARTISTS, type ArtistSeed } from './data/artists.data';

export class ArtistSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.find(
      Artist,
      { name: { $in: ARTISTS.map((artist) => artist.name) } },
      { fields: ['name'] },
    );
    const existingNames = new Set(existing.map((artist) => artist.name));
    const missing = ARTISTS.filter((artist) => !existingNames.has(artist.name));

    if (missing.length === 0) return;

    const storage = new StorageService(new ConfigService());

    const imageKeys = await Promise.all(
      missing.map((artist) => this.uploadPhoto(storage, artist)),
    );

    missing.forEach(({ photoUrl: _photoUrl, ...data }, index) => {
      em.persist(Artist.create({ ...data, imageKey: imageKeys[index] }));
    });

    await em.flush();
  }

  private async uploadPhoto(
    storage: StorageService,
    artist: ArtistSeed,
  ): Promise<string> {
    const response = await fetch(artist.photoUrl, {
      headers: { Accept: 'image/jpeg' },
    });

    if (!response.ok) {
      throw new Error(
        `Foto de ${artist.name}: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!ALLOWED_MIME_TYPES.public.includes(contentType)) {
      throw new Error(`Foto de ${artist.name}: tipo ${contentType} não aceito`);
    }

    const key = `artists/${randomUUID()}.${FILE_EXTENSIONS[contentType]}`;
    const body = Buffer.from(await response.arrayBuffer());

    await storage.upload('public', key, body, contentType);

    return key;
  }
}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';

export const artistResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  legalName: z.string(),
  genre: z.string(),
  bio: z.string(),
  imageUrl: z.string(),
  socialLinks: z.record(z.string(), z.string()),
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class ArtistResponseDto extends createZodDto(artistResponseSchema, {
  codec: true,
}) {}

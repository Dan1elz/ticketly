import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createArtistSchema, socialLinksSchema } from './create-artist.dto';

export const updateArtistSchema = createArtistSchema
  .omit({ socialLinks: true })
  .partial()
  .extend({
    socialLinks: socialLinksSchema.optional(),
    isActive: z
      .boolean({ error: 'isActive deve ser true ou false' })
      .optional(),
  });

export class UpdateArtistDto extends createZodDto(updateArtistSchema) {}

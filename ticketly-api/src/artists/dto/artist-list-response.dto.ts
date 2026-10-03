import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { artistResponseSchema } from './artist-response.dto';

const artistListResponseSchema = z.object({
  items: z.array(artistResponseSchema),
  total: z.number().int(),
});

export class ArtistListResponseDto extends createZodDto(
  artistListResponseSchema,
  { codec: true },
) {}

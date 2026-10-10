import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const uploadResultSchema = z.object({
  key: z.string().meta({
    example: 'artists/0b9c1e7a-5f7e-4a51-9a51-3c1f2d9e8b10.webp',
  }),
  url: z.url().meta({
    example:
      'http://localhost:9000/ticketly-public/artists/0b9c1e7a-5f7e-4a51-9a51-3c1f2d9e8b10.webp',
  }),
});

export class UploadResultDto extends createZodDto(uploadResultSchema) {}

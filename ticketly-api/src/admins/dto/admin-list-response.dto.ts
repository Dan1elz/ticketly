import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { adminResponseSchema } from './admin-response.dto';

const adminListResponseSchema = z.object({
  items: z.array(adminResponseSchema),
  total: z.number().int(),
});

export class AdminListResponseDto extends createZodDto(
  adminListResponseSchema,
  { codec: true },
) {}

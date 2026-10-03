import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { adminResponseSchema } from '../../admins/dto/admin-response.dto';

const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: adminResponseSchema,
});

export class LoginResponseDto extends createZodDto(loginResponseSchema, {
  codec: true,
}) {}

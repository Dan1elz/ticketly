import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateTimeSchema } from '../../common/zod/schemas';

// É o "mapper": o serializer passa a entidade por esse schema e só o que está
// aqui vai na resposta (password e afins ficam de fora)
export const adminResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  isActive: z.boolean(),
  lastLoginAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export class AdminResponseDto extends createZodDto(adminResponseSchema, {
  codec: true,
}) {}

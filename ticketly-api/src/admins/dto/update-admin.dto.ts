import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createAdminSchema } from './create-admin.dto';

export const updateAdminSchema = createAdminSchema.pick({ name: true }).extend({
  isActive: z.boolean({ error: 'isActive deve ser true ou false' }).optional(),
});

export class UpdateAdminDto extends createZodDto(updateAdminSchema) {}

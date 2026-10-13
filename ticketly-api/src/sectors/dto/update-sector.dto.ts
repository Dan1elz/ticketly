import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  maxPerOrderSchema,
  priceCentsSchema,
  sectorColorSchema,
  sectorDescriptionSchema,
  sectorDisplayOrderSchema,
  sectorNameSchema,
} from './create-sector.dto';

// Só o que vier muda. O tipo não muda: os assentos já foram gerados no formato
// dele. Mudar o preço não mexe em quem já reservou (o pedido guarda o preço)
export const updateSectorSchema = z.strictObject({
  name: sectorNameSchema.optional(),
  description: sectorDescriptionSchema.optional(),
  priceCents: priceCentsSchema.optional(),
  color: sectorColorSchema.optional(),
  displayOrder: sectorDisplayOrderSchema.optional(),
  maxPerOrder: maxPerOrderSchema.optional(),
});

export class UpdateSectorDto extends createZodDto(updateSectorSchema) {}

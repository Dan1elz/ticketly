import { z } from "zod"

import type {
  ISector,
  ISectorPayload,
  TSectorUpdatePayload,
} from "@/interfaces"
import { formatCentsInput, formatOnlyNumbers, parseCents } from "@/utils"

const integerText = (label: string, min: number, max = 9999) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} deve ser um número inteiro`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `${label} deve ser no mínimo ${min}`)
        .max(max, `${label} deve ser no máximo ${max}`)
    )

export const sectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Máximo de 100 caracteres"),
  type: z.enum(["SEATED", "GENERAL_ADMISSION"]),
  description: z.string().trim().max(500, "Máximo de 500 caracteres"),
  price: z
    .string()
    .trim()
    .min(1, "Preço é obrigatório")
    .refine(
      (value) => formatOnlyNumbers(value).length <= 9,
      "Preço muito alto"
    ),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB"),
  displayOrder: integerText("Ordem", 1),
  maxPerOrder: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Use um inteiro")
    .refine((value) => value === "" || Number(value) >= 1, "Mínimo 1")
    .transform((value) => (value === "" ? null : Number(value))),
})

export type SectorFormData = z.input<typeof sectorSchema>
export type SectorFormOutput = z.output<typeof sectorSchema>

export function emptySectorForm(displayOrder = 1): SectorFormData {
  return {
    name: "",
    type: "SEATED",
    description: "",
    price: "",
    color: "#7C3AED",
    displayOrder: String(displayOrder),
    maxPerOrder: "",
  }
}

export function sectorToForm(sector: ISector): SectorFormData {
  return {
    name: sector.name,
    type: sector.type,
    description: sector.description ?? "",
    price: formatCentsInput(String(sector.priceCents)),
    color: sector.color.toUpperCase(),
    displayOrder: String(sector.displayOrder),
    maxPerOrder: sector.maxPerOrder === null ? "" : String(sector.maxPerOrder),
  }
}

export function formToSectorPayload(data: SectorFormOutput): ISectorPayload {
  return {
    name: data.name,
    type: data.type,
    description: data.description || null,
    priceCents: parseCents(data.price),
    color: data.color.toUpperCase(),
    displayOrder: data.displayOrder,
    maxPerOrder: data.maxPerOrder,
  }
}

// O PATCH não aceita `type`: ele não muda depois de criado
export function formToSectorUpdatePayload(
  data: SectorFormOutput
): TSectorUpdatePayload {
  const { type: _type, ...payload } = formToSectorPayload(data)

  return payload
}

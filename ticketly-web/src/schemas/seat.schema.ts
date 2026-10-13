import { z } from "zod"

import type { ISeatBlockPayload, ISeatQuantityPayload } from "@/interfaces"

export const MAX_SEATS_PER_BLOCK = 2000
export const MAX_ROWS_PER_BLOCK = 100
export const MAX_QUANTITY_PER_REQUEST = 10000
export const MAX_ADJUST_PER_ACTION = 200

/**
 * Lê o campo de fileiras. Aceita lista ("A, B, C") e intervalo de letras
 * ("A-J"), nos dois casos separados por vírgula ou espaço.
 */
export function parseRows(text: string): string[] {
  const tokens = text
    .toUpperCase()
    .split(/[\s,;]+/)
    .filter(Boolean)

  return tokens.flatMap((token) => {
    const range = /^([A-Z])-([A-Z])$/.exec(token)
    if (!range) return [token]

    const from = range[1].charCodeAt(0)
    const to = range[2].charCodeAt(0)
    const [start, end] = from <= to ? [from, to] : [to, from]

    return Array.from({ length: end - start + 1 }, (_, index) =>
      String.fromCharCode(start + index)
    )
  })
}

const positiveInt = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label}: use um número inteiro`)
    .transform(Number)
    .pipe(z.number().min(1, `${label} deve ser maior que zero`))

export const seatBlockSchema = z
  .object({
    rows: z
      .string()
      .trim()
      .min(1, "Informe ao menos uma fileira")
      .superRefine((text, ctx) => {
        const rows = parseRows(text)

        if (rows.length > MAX_ROWS_PER_BLOCK) {
          ctx.addIssue({
            code: "custom",
            message: `No máximo ${MAX_ROWS_PER_BLOCK} fileiras por bloco`,
          })
        }

        if (rows.some((row) => row.length > 10)) {
          ctx.addIssue({
            code: "custom",
            message: "Cada fileira deve ter no máximo 10 caracteres",
          })
        }

        if (new Set(rows).size !== rows.length) {
          ctx.addIssue({ code: "custom", message: "Fileira repetida" })
        }
      })
      .transform(parseRows),
    numberStart: positiveInt("Número inicial"),
    numberEnd: positiveInt("Número final"),
    gridRowStart: positiveInt("Linha"),
    gridColumnStart: positiveInt("Coluna"),
    isAccessible: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.numberEnd < data.numberStart) {
      ctx.addIssue({
        code: "custom",
        message: "Deve ser maior ou igual ao inicial",
        path: ["numberEnd"],
      })
      return
    }

    const total = data.rows.length * (data.numberEnd - data.numberStart + 1)

    if (total > MAX_SEATS_PER_BLOCK) {
      ctx.addIssue({
        code: "custom",
        message: `O bloco tem ${total} assentos; o máximo é ${MAX_SEATS_PER_BLOCK} por vez`,
        path: ["rows"],
      })
    }
  })

export type SeatBlockFormData = z.input<typeof seatBlockSchema>
export type SeatBlockFormOutput = z.output<typeof seatBlockSchema>

export function emptySeatBlockForm(
  gridRowStart = 1,
  gridColumnStart = 1
): SeatBlockFormData {
  return {
    rows: "",
    numberStart: "1",
    numberEnd: "10",
    gridRowStart: String(gridRowStart),
    gridColumnStart: String(gridColumnStart),
    isAccessible: false,
  }
}

export function formToSeatBlockPayload(
  data: SeatBlockFormOutput
): ISeatBlockPayload {
  return { ...data }
}

export const seatQuantitySchema = z.object({
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, "Use um número inteiro")
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, "Deve ser maior que zero")
        .max(
          MAX_QUANTITY_PER_REQUEST,
          `No máximo ${MAX_QUANTITY_PER_REQUEST} por vez`
        )
    ),
})

export type SeatQuantityFormData = z.input<typeof seatQuantitySchema>
export type SeatQuantityFormOutput = z.output<typeof seatQuantitySchema>

export function formToSeatQuantityPayload(
  data: SeatQuantityFormOutput
): ISeatQuantityPayload {
  return { quantity: data.quantity }
}

export const seatNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "A observação é obrigatória")
    .max(500, "Máximo de 500 caracteres"),
})

export type SeatNoteFormData = z.input<typeof seatNoteSchema>

// Pista: bloquear, desbloquear ou cancelar uma quantidade de ingressos. A API
// muda um assento por requisição, então o lote tem teto
export const seatAdjustSchema = z
  .object({
    action: z.enum(["block", "unblock", "cancel"]),
    quantity: positiveInt("Quantidade").pipe(
      z
        .number()
        .max(
          MAX_ADJUST_PER_ACTION,
          `No máximo ${MAX_ADJUST_PER_ACTION} por vez`
        )
    ),
    note: z.string().trim().max(500, "Máximo de 500 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (data.action !== "unblock" && !data.note) {
      ctx.addIssue({
        code: "custom",
        message: "A observação é obrigatória",
        path: ["note"],
      })
    }
  })

export type SeatAdjustFormData = z.input<typeof seatAdjustSchema>
export type SeatAdjustFormOutput = z.output<typeof seatAdjustSchema>

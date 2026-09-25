import { z } from "zod"

import { formatOnlyNumbers, validateCpf, validateEmail } from "@/utils"

// Passo 2 do fluxo: dados do comprador + código da reserva
export const checkoutSchema = z.object({
  reservationCode: z.string().trim().min(1, "Código da reserva é obrigatório"),
  customerName: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  customerEmail: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório")
    .refine(validateEmail, "E-mail inválido"),
  // O input mostra "000.000.000-00", mas pra API vai só os números
  customerCpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(validateCpf, "CPF inválido")
    .transform(formatOnlyNumbers),
})

// input = o que o formulário tem | output = o que vai pra API (depois do transform)
export type CheckoutFormData = z.input<typeof checkoutSchema>
export type CheckoutPayload = z.output<typeof checkoutSchema>

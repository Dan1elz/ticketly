import { z } from "zod"

// No login não repete as regras de senha forte: só confere se preencheu.
// Quem diz se a senha está certa é a API
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório")
    .pipe(z.email("E-mail inválido")),
  password: z.string().min(1, "Senha é obrigatória"),
})

export type LoginFormData = z.infer<typeof loginSchema>

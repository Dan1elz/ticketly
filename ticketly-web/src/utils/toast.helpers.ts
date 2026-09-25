import { toast } from "sonner"

import { ApiError } from "@/services/api.service"

/**
 * Mostra o erro num toast. Use no catch de qualquer chamada à API
 * @param error - O que caiu no catch
 * @param fallbackMessage - Mensagem quando o erro não é reconhecido
 *
 * @example
 * try { await eventService.create(data, token) } catch (error) { handleError(error) }
 */
export function handleError(
  error: unknown,
  fallbackMessage = "Erro desconhecido"
): void {
  if (error instanceof ApiError) {
    // Erro de validação do Nest pode trazer várias mensagens: mostra todas
    toast.error(error.messages[0], {
      description:
        error.messages.length > 1
          ? error.messages.slice(1).join("\n")
          : undefined,
    })
    return
  }

  if (error instanceof Error) {
    console.error(error)
    toast.error(error.message || fallbackMessage)
    return
  }

  toast.error(fallbackMessage)
}

/**
 * Mostra toast de sucesso
 * @param message - Mensagem
 */
export function handleSuccess(message: string): void {
  toast.success(message)
}

/**
 * Mostra toast de aviso
 * @param message - Mensagem
 */
export function handleWarning(message: string): void {
  toast.warning(message)
}

/**
 * Mostra toast informativo
 * @param message - Mensagem
 */
export function handleInfo(message: string): void {
  toast(message)
}

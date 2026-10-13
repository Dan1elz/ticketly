import type { ISeatBatchResult, TSeatAction } from "@/interfaces"
import { handleSuccess, handleWarning } from "@/utils"

const PARTICIPLES: Record<TSeatAction, [string, string]> = {
  block: ["bloqueado", "bloqueados"],
  unblock: ["desbloqueado", "desbloqueados"],
  cancel: ["cancelado", "cancelados"],
}

/**
 * Resume o resultado de uma ação em lote: tudo certo, falha parcial (quantos
 * deram certo) ou nenhum.
 */
export function reportSeatBatch(
  action: TSeatAction,
  { done, failed, firstError }: ISeatBatchResult
) {
  const [singular, plural] = PARTICIPLES[action]
  const label = (count: number) =>
    `${count} assento${count === 1 ? "" : "s"} ${count === 1 ? singular : plural}`

  if (failed === 0) {
    handleSuccess(label(done))
    return
  }

  const reason = firstError ? ` Motivo: ${firstError}.` : ""

  if (done === 0) {
    handleWarning(`Nenhum assento foi alterado.${reason}`)
    return
  }

  handleWarning(
    `${label(done)}; ${failed} não ${failed === 1 ? "pôde" : "puderam"} ser alterado${failed === 1 ? "" : "s"}.${reason}`
  )
}

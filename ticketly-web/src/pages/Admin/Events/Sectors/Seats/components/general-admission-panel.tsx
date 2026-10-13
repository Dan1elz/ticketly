import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useSectors } from "@/hooks/use-sectors"
import type { ISector, TSeatAction, TSeatStatus } from "@/interfaces"
import {
  MAX_ADJUST_PER_ACTION,
  seatAdjustSchema,
  type SeatAdjustFormData,
  type SeatAdjustFormOutput,
} from "@/schemas"
import { formatNumber, handleError } from "@/utils"
import { reportSeatBatch } from "../../components/seat-batch-report"

const ACTION_LABELS: Record<TSeatAction, string> = {
  block: "Bloquear ingressos",
  unblock: "Desbloquear ingressos",
  cancel: "Cancelar ingressos",
}

const SOURCE_STATUS: Record<TSeatAction, TSeatStatus> = {
  block: "AVAILABLE",
  unblock: "BLOCKED",
  cancel: "AVAILABLE",
}

/**
 * Pista não tem mapa: o admin diz quantos ingressos quer tirar de venda (ou
 * devolver) e a tela aplica, um por requisição, nos de maior número.
 */
export function GeneralAdmissionPanel({ sector }: { sector: ISector }) {
  const { loadSeats, changeSeats } = useSectors()
  const [progress, setProgress] = useState<number | null>(null)
  const [pending, setPending] = useState<SeatAdjustFormOutput | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SeatAdjustFormData, unknown, SeatAdjustFormOutput>({
    resolver: zodResolver(seatAdjustSchema),
    defaultValues: { action: "block", quantity: "", note: "" },
  })

  const action = useWatch({ control, name: "action" })
  const eligible = sector.seatCounts[SOURCE_STATUS[action]]

  const apply = async (data: SeatAdjustFormOutput) => {
    try {
      const seats = await loadSeats(sector.id)
      const targets = seats
        .filter((seat) => seat.status === SOURCE_STATUS[data.action])
        .toSorted((a, b) => b.number - a.number)
        .slice(0, data.quantity)

      setProgress(0)
      const result = await changeSeats(
        data.action,
        targets.map((seat) => seat.id),
        data.action === "unblock" ? null : data.note,
        (processed) => setProgress(processed)
      )

      reportSeatBatch(data.action, result)
      if (result.done > 0)
        reset({ action: data.action, quantity: "", note: "" })
    } catch (err) {
      handleError(err, "Não foi possível alterar os ingressos")
    } finally {
      setProgress(null)
    }
  }

  const onSubmit = async (data: SeatAdjustFormOutput) => {
    const available = sector.seatCounts[SOURCE_STATUS[data.action]]

    if (data.quantity > available) {
      setError("quantity", {
        message:
          available === 0
            ? "Não há ingressos nesse status"
            : `O setor só tem ${formatNumber(available)} nesse status`,
      })
      return
    }

    if (data.action === "cancel") {
      setPending(data)
      return
    }

    await apply(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidade</CardTitle>
        <CardDescription>
          Tire ingressos de venda (cortesia, produção) ou devolva à venda. A API
          altera um ingresso por vez, por isso o limite é de{" "}
          {MAX_ADJUST_PER_ACTION} por operação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <Field>
                <FieldLabel htmlFor="adjust-action">Ação</FieldLabel>
                <Controller
                  control={control}
                  name="action"
                  render={({ field }) => (
                    <Select
                      items={ACTION_LABELS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="adjust-action" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {Object.entries(ACTION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field data-invalid={!!errors.quantity}>
                <FieldLabel htmlFor="adjust-quantity">Quantidade</FieldLabel>
                <Input
                  id="adjust-quantity"
                  inputMode="numeric"
                  placeholder="50"
                  aria-invalid={!!errors.quantity}
                  {...register("quantity")}
                />
                <FieldError errors={[errors.quantity]} />
              </Field>
            </div>

            <p className="-mt-2 text-xs text-muted-foreground">
              {action === "unblock"
                ? `${formatNumber(eligible)} ingresso${eligible === 1 ? "" : "s"} bloqueado${eligible === 1 ? "" : "s"} no setor.`
                : `${formatNumber(eligible)} ingresso${eligible === 1 ? "" : "s"} disponíve${eligible === 1 ? "l" : "is"} no setor.`}
            </p>

            {action !== "unblock" && (
              <Field data-invalid={!!errors.note}>
                <FieldLabel htmlFor="adjust-note">Observação</FieldLabel>
                <Textarea
                  id="adjust-note"
                  rows={2}
                  placeholder="Cortesia da produção"
                  aria-invalid={!!errors.note}
                  {...register("note")}
                />
                <FieldDescription>
                  Obrigatória. Fica registrada em cada ingresso.
                </FieldDescription>
                <FieldError errors={[errors.note]} />
              </Field>
            )}
          </FieldGroup>

          <Button
            type="submit"
            className="self-start"
            variant={action === "cancel" ? "destructive" : "default"}
            disabled={isSubmitting || progress !== null}
          >
            {(isSubmitting || progress !== null) && (
              <Spinner data-icon="inline-start" />
            )}
            {progress !== null ? `Aplicando ${progress}...` : "Aplicar"}
          </Button>
        </form>
      </CardContent>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Cancelar ${pending?.quantity ?? 0} ingressos?`}
        description="Cancelar é definitivo: os ingressos nunca voltam a ser vendidos. Para tirar de venda só por um tempo, bloqueie."
        confirmLabel="Cancelar ingressos"
        cancelLabel="Voltar"
        onConfirm={async () => {
          if (pending) await apply(pending)
        }}
      />
    </Card>
  )
}

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useSectors } from "@/hooks/use-sectors"
import type { ISeat } from "@/interfaces"
import {
  emptySeatBlockForm,
  formToSeatBlockPayload,
  parseRows,
  seatBlockSchema,
  type SeatBlockFormData,
  type SeatBlockFormOutput,
} from "@/schemas"
import { ApiError } from "@/services"
import { formatNumber, handleError, handleSuccess } from "@/utils"

const CONFLICT_MESSAGE =
  "Já existem assentos nessa fileira e número, ou nessa posição da grade. Ajuste a faixa ou a posição do bloco."

// Mesma regra da API: assento cancelado libera fileira/número e posição
function hasConflict(data: SeatBlockFormOutput, seats: ISeat[]): boolean {
  const active = seats.filter((seat) => seat.status !== "CANCELLED")
  const names = new Set(active.map((seat) => `${seat.row}|${seat.number}`))
  const cells = new Set(
    active.map((seat) => `${seat.gridRow}|${seat.gridColumn}`)
  )

  return data.rows.some((row, rowIndex) => {
    for (let number = data.numberStart; number <= data.numberEnd; number++) {
      const column = data.gridColumnStart + (number - data.numberStart)

      if (
        names.has(`${row}|${number}`) ||
        cells.has(`${data.gridRowStart + rowIndex}|${column}`)
      ) {
        return true
      }
    }

    return false
  })
}

export function SeatBlockDialog({
  open,
  onOpenChange,
  sectorId,
  seats,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectorId: string
  seats: ISeat[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerar assentos</DialogTitle>
          <DialogDescription>
            Cada bloco é um retângulo da grade: as fileiras viram linhas e os
            números viram colunas. Gere um bloco por vez.
          </DialogDescription>
        </DialogHeader>
        <BlockForm
          sectorId={sectorId}
          seats={seats}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function BlockForm({
  sectorId,
  seats,
  onDone,
}: {
  sectorId: string
  seats: ISeat[]
  onDone: () => void
}) {
  const { createSeatBlock } = useSectors()

  // Sugere o bloco logo abaixo do que já existe
  const nextGridRow =
    seats.reduce(
      (max, seat) =>
        seat.status === "CANCELLED" ? max : Math.max(max, seat.gridRow ?? 0),
      0
    ) + 1

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SeatBlockFormData, unknown, SeatBlockFormOutput>({
    resolver: zodResolver(seatBlockSchema),
    defaultValues: emptySeatBlockForm(nextGridRow),
  })

  const values = useWatch({ control })

  const onSubmit = async (data: SeatBlockFormOutput) => {
    if (hasConflict(data, seats)) {
      setError("rows", { message: CONFLICT_MESSAGE })
      return
    }

    try {
      await createSeatBlock(sectorId, formToSeatBlockPayload(data))

      const total = data.rows.length * (data.numberEnd - data.numberStart + 1)
      handleSuccess(
        `${formatNumber(total)} assento${total === 1 ? "" : "s"} gerado${total === 1 ? "" : "s"}`
      )
      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        setError("rows", { message: err.message })
        return
      }

      handleError(err, "Não foi possível gerar os assentos")
    }
  }

  const rows = parseRows(values.rows ?? "")
  const start = Number(values.numberStart)
  const end = Number(values.numberEnd)
  const rowStart = Number(values.gridRowStart)
  const columnStart = Number(values.gridColumnStart)
  const validRange =
    rows.length > 0 &&
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 1 &&
    end >= start
  const perRow = validRange ? end - start + 1 : 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
      <div className="-mx-6 flex max-h-[65vh] flex-col overflow-y-auto px-6 py-1">
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.rows}>
            <FieldLabel htmlFor="block-rows">Fileiras</FieldLabel>
            <Input
              id="block-rows"
              placeholder="A-J ou A, B, C"
              autoComplete="off"
              aria-invalid={!!errors.rows}
              {...register("rows")}
            />
            <FieldDescription>
              Um intervalo de letras (A-J) ou uma lista separada por vírgula.
            </FieldDescription>
            <FieldError errors={[errors.rows]} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={!!errors.numberStart}>
              <FieldLabel htmlFor="block-number-start">
                Número inicial
              </FieldLabel>
              <Input
                id="block-number-start"
                inputMode="numeric"
                aria-invalid={!!errors.numberStart}
                {...register("numberStart")}
              />
              <FieldError errors={[errors.numberStart]} />
            </Field>

            <Field data-invalid={!!errors.numberEnd}>
              <FieldLabel htmlFor="block-number-end">Número final</FieldLabel>
              <Input
                id="block-number-end"
                inputMode="numeric"
                aria-invalid={!!errors.numberEnd}
                {...register("numberEnd")}
              />
              <FieldError errors={[errors.numberEnd]} />
            </Field>

            <Field data-invalid={!!errors.gridRowStart}>
              <FieldLabel htmlFor="block-grid-row">
                Linha da grade (primeira fileira)
              </FieldLabel>
              <Input
                id="block-grid-row"
                inputMode="numeric"
                aria-invalid={!!errors.gridRowStart}
                {...register("gridRowStart")}
              />
              <FieldError errors={[errors.gridRowStart]} />
            </Field>

            <Field data-invalid={!!errors.gridColumnStart}>
              <FieldLabel htmlFor="block-grid-column">
                Coluna da grade (número inicial)
              </FieldLabel>
              <Input
                id="block-grid-column"
                inputMode="numeric"
                aria-invalid={!!errors.gridColumnStart}
                {...register("gridColumnStart")}
              />
              <FieldError errors={[errors.gridColumnStart]} />
            </Field>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            Deixe linhas ou colunas vazias entre um bloco e outro para criar
            corredor.
          </p>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="block-accessible">
                Assentos para PCD
              </FieldLabel>
              <FieldDescription>
                Marca todos os assentos do bloco como acessíveis.
              </FieldDescription>
            </FieldContent>
            <Controller
              control={control}
              name="isAccessible"
              render={({ field }) => (
                <Switch
                  id="block-accessible"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </Field>

          <div className="rounded-2xl border border-dashed px-4 py-3 text-sm">
            {validRange ? (
              <>
                <p className="font-medium">
                  {formatNumber(rows.length * perRow)} assento
                  {rows.length * perRow === 1 ? "" : "s"}
                </p>
                <p className="text-muted-foreground">
                  {rows.length} fileira{rows.length === 1 ? "" : "s"} ({rows[0]}
                  {rows.length > 1 ? ` a ${rows[rows.length - 1]}` : ""}) ×{" "}
                  {perRow} número{perRow === 1 ? "" : "s"}
                  {Number.isInteger(rowStart) &&
                    Number.isInteger(columnStart) &&
                    ` · linhas ${rowStart} a ${rowStart + rows.length - 1}, colunas ${columnStart} a ${columnStart + perRow - 1}`}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Informe as fileiras e a faixa de números para ver o tamanho do
                bloco.
              </p>
            )}
          </div>
        </FieldGroup>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onDone}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Gerar assentos
        </Button>
      </DialogFooter>
    </form>
  )
}

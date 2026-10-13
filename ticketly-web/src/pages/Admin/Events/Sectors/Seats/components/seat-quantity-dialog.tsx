import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useSectors } from "@/hooks/use-sectors"
import {
  formToSeatQuantityPayload,
  seatQuantitySchema,
  type SeatQuantityFormData,
  type SeatQuantityFormOutput,
} from "@/schemas"
import { formatNumber, handleError, handleSuccess } from "@/utils"

export function SeatQuantityDialog({
  open,
  onOpenChange,
  sectorId,
  current,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectorId: string
  current: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar ingressos</DialogTitle>
          <DialogDescription>
            A pista não tem lugar marcado: cada ingresso é só um número. A
            numeração continua de onde parou.
          </DialogDescription>
        </DialogHeader>
        <QuantityForm
          sectorId={sectorId}
          current={current}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function QuantityForm({
  sectorId,
  current,
  onDone,
}: {
  sectorId: string
  current: number
  onDone: () => void
}) {
  const { createSeatQuantity } = useSectors()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeatQuantityFormData, unknown, SeatQuantityFormOutput>({
    resolver: zodResolver(seatQuantitySchema),
    defaultValues: { quantity: "" },
  })

  const onSubmit = async (data: SeatQuantityFormOutput) => {
    try {
      await createSeatQuantity(sectorId, formToSeatQuantityPayload(data))
      handleSuccess(
        `${formatNumber(data.quantity)} ingresso${data.quantity === 1 ? "" : "s"} adicionado${data.quantity === 1 ? "" : "s"}`
      )
      onDone()
    } catch (err) {
      handleError(err, "Não foi possível adicionar os ingressos")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
      <Field data-invalid={!!errors.quantity}>
        <FieldLabel htmlFor="quantity">Quantidade</FieldLabel>
        <Input
          id="quantity"
          inputMode="numeric"
          autoFocus
          placeholder="500"
          aria-invalid={!!errors.quantity}
          {...register("quantity")}
        />
        <FieldDescription>
          {current > 0
            ? `O setor já tem ${formatNumber(current)} ingressos; os novos entram em seguida.`
            : "Ainda não há ingressos neste setor."}
        </FieldDescription>
        <FieldError errors={[errors.quantity]} />
      </Field>

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
          Adicionar
        </Button>
      </DialogFooter>
    </form>
  )
}

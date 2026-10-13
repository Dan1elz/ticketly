import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { ColorPicker } from "@/components/app/color-picker"
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { SECTOR_TYPE_LABELS } from "@/constants"
import { useSectors } from "@/hooks/use-sectors"
import type { ISector } from "@/interfaces"
import {
  emptySectorForm,
  formToSectorPayload,
  formToSectorUpdatePayload,
  sectorSchema,
  sectorToForm,
  type SectorFormData,
  type SectorFormOutput,
} from "@/schemas"
import { ApiError } from "@/services"
import { formatCentsInput, handleError, handleSuccess } from "@/utils"

export function SectorFormDialog({
  open,
  onOpenChange,
  eventId,
  sector,
  nextOrder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  sector: ISector | null
  nextOrder: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{sector ? "Editar setor" : "Novo setor"}</DialogTitle>
          <DialogDescription>
            {sector
              ? "Mudar o preço não altera o que já foi reservado: o pedido guarda o valor da hora."
              : "Depois de criar o setor, gere os assentos dele."}
          </DialogDescription>
        </DialogHeader>
        <SectorForm
          eventId={eventId}
          sector={sector}
          nextOrder={nextOrder}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function SectorForm({
  eventId,
  sector,
  nextOrder,
  onDone,
}: {
  eventId: string
  sector: ISector | null
  nextOrder: number
  onDone: () => void
}) {
  const { createSector, updateSector } = useSectors()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SectorFormData, unknown, SectorFormOutput>({
    resolver: zodResolver(sectorSchema),
    defaultValues: sector ? sectorToForm(sector) : emptySectorForm(nextOrder),
  })

  const onSubmit = async (data: SectorFormOutput) => {
    try {
      if (sector) {
        await updateSector(sector.id, formToSectorUpdatePayload(data))
        handleSuccess("Setor atualizado")
      } else {
        await createSector(eventId, formToSectorPayload(data))
        handleSuccess("Setor criado")
      }

      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        setError("name", { message: err.message })
        return
      }

      handleError(err, "Não foi possível salvar o setor")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
      <div className="-mx-6 flex max-h-[65vh] flex-col overflow-y-auto px-6 py-1">
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="sector-name">Nome</FieldLabel>
            <Input
              id="sector-name"
              placeholder="Pista Premium"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="sector-type">Tipo</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  items={SECTOR_TYPE_LABELS}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!sector}
                >
                  <SelectTrigger id="sector-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {Object.entries(SECTOR_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>
              {sector
                ? "O tipo não muda depois que o setor é criado."
                : "Lugar marcado: o cliente escolhe o assento na grade. Pista: o cliente escolhe só a quantidade."}
            </FieldDescription>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={!!errors.price}>
              <FieldLabel htmlFor="sector-price">Preço</FieldLabel>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>R$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="sector-price"
                      inputMode="numeric"
                      placeholder="0,00"
                      aria-invalid={!!errors.price}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        field.onChange(formatCentsInput(event.target.value))
                      }
                    />
                  </InputGroup>
                )}
              />
              <FieldError errors={[errors.price]} />
            </Field>

            <Field data-invalid={!!errors.maxPerOrder}>
              <FieldLabel htmlFor="sector-max">Máximo por pedido</FieldLabel>
              <Input
                id="sector-max"
                inputMode="numeric"
                placeholder="Sem limite"
                aria-invalid={!!errors.maxPerOrder}
                {...register("maxPerOrder")}
              />
              <FieldError errors={[errors.maxPerOrder]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.color}>
            <FieldLabel htmlFor="sector-color">Cor</FieldLabel>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorPicker
                  id="sector-color"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors.color}
                />
              )}
            />
            <FieldError errors={[errors.color]} />
          </Field>

          <Field data-invalid={!!errors.displayOrder}>
            <FieldLabel htmlFor="sector-order">Ordem de exibição</FieldLabel>
            <Input
              id="sector-order"
              inputMode="numeric"
              className="sm:max-w-32"
              aria-invalid={!!errors.displayOrder}
              {...register("displayOrder")}
            />
            <FieldError errors={[errors.displayOrder]} />
          </Field>

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="sector-description">
              Descrição (opcional)
            </FieldLabel>
            <Textarea
              id="sector-description"
              rows={3}
              placeholder="Visão frontal do palco"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>
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
          {sector ? "Salvar alterações" : "Criar setor"}
        </Button>
      </DialogFooter>
    </form>
  )
}

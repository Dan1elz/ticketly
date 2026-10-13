import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react"
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form"

import { ArtistPicker } from "@/components/app/artist-picker"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LINEUP_STATUS_LABELS, PERFORMANCE_TYPE_LABELS } from "@/constants"
import { cn } from "@/lib/utils"
import type { EventFormData } from "@/schemas"

export function LineupItem({
  index,
  total,
  onMove,
  onRemove,
  onCreateArtist,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
  onCreateArtist: (index: number) => void
}) {
  const { control, register, setValue } = useFormContext<EventFormData>()
  const { errors: formErrors } = useFormState({ control, name: "lineup" })
  const item = useWatch({ control, name: `lineup.${index}` })
  const stages = useWatch({ control, name: "stages" })
  const errors = formErrors.lineup?.[index]

  const prefix = `lineup-${index}`
  const isCancelled = item?.status === "CANCELLED"

  const stageLabels = Object.fromEntries(
    (stages ?? []).map((stage, position) => [
      stage.id,
      stage.name.trim() || `Palco ${position + 1}`,
    ])
  )

  const pickArtist = (
    artist: { id: string; name: string; imageUrl: string } | null
  ) => {
    setValue(`lineup.${index}.artistName`, artist?.name ?? "")
    setValue(`lineup.${index}.artistImageUrl`, artist?.imageUrl ?? "")
    setValue(`lineup.${index}.artistId`, artist?.id ?? "", {
      shouldValidate: true,
    })
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl border bg-card p-4 transition-colors",
        isCancelled && "border-dashed bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>

        <Field
          data-invalid={!!errors?.artistId}
          className="min-w-0 flex-1 gap-1.5"
        >
          <ArtistPicker
            id={`${prefix}-artist`}
            value={
              item?.artistId
                ? {
                    id: item.artistId,
                    name: item.artistName,
                    imageUrl: item.artistImageUrl,
                  }
                : null
            }
            onChange={pickArtist}
            onCreateNew={() => onCreateArtist(index)}
            invalid={!!errors?.artistId}
          />
          <FieldError errors={[errors?.artistId]} />
        </Field>

        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Subir"
                  disabled={index === 0}
                  onClick={() => onMove(index, index - 1)}
                />
              }
            >
              <ArrowUpIcon />
            </TooltipTrigger>
            <TooltipContent>Subir na ordem</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Descer"
                  disabled={index === total - 1}
                  onClick={() => onMove(index, index + 1)}
                />
              }
            >
              <ArrowDownIcon />
            </TooltipTrigger>
            <TooltipContent>Descer na ordem</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover do lineup"
                  className="text-destructive"
                  onClick={() => onRemove(index)}
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent>Remover do lineup</TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Field
          data-invalid={!!errors?.stageId}
          className="col-span-2 gap-1.5 md:col-span-1"
        >
          <FieldLabel htmlFor={`${prefix}-stage`}>Palco</FieldLabel>
          <Controller
            control={control}
            name={`lineup.${index}.stageId`}
            render={({ field }) => (
              <Select
                items={stageLabels}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <SelectTrigger
                  id={`${prefix}-stage`}
                  className="w-full"
                  aria-invalid={!!errors?.stageId}
                >
                  <SelectValue placeholder="Escolha o palco" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors?.stageId]} />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${prefix}-type`}>Tipo</FieldLabel>
          <Controller
            control={control}
            name={`lineup.${index}.performanceType`}
            render={({ field }) => (
              <Select
                items={PERFORMANCE_TYPE_LABELS}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={`${prefix}-type`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {Object.entries(PERFORMANCE_TYPE_LABELS).map(
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
        </Field>

        <Field className="gap-1.5">
          <FieldLabel htmlFor={`${prefix}-status`}>Situação</FieldLabel>
          <Controller
            control={control}
            name={`lineup.${index}.status`}
            render={({ field }) => (
              <Select
                items={LINEUP_STATUS_LABELS}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={`${prefix}-status`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {Object.entries(LINEUP_STATUS_LABELS).map(
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
        </Field>
        <Field data-invalid={!!errors?.startTime} className="gap-1.5">
          <FieldLabel htmlFor={`${prefix}-start`}>Início</FieldLabel>
          <Input
            id={`${prefix}-start`}
            type="time"
            aria-invalid={!!errors?.startTime}
            {...register(`lineup.${index}.startTime`)}
          />
          <FieldError errors={[errors?.startTime]} />
        </Field>

        <Field data-invalid={!!errors?.endTime} className="gap-1.5">
          <FieldLabel htmlFor={`${prefix}-end`}>Fim</FieldLabel>
          <Input
            id={`${prefix}-end`}
            type="time"
            aria-invalid={!!errors?.endTime}
            {...register(`lineup.${index}.endTime`)}
          />
          <FieldError errors={[errors?.endTime]} />
        </Field>
      </div>
    </div>
  )
}

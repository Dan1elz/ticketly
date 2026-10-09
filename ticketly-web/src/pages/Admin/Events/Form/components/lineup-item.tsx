import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form"

import { ArtistAvatar } from "@/components/app/artist-avatar"
import { ArtistPicker } from "@/components/app/artist-picker"
import { Badge } from "@/components/ui/badge"
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
  const errors = formErrors.lineup?.[index]

  const prefix = `lineup-${index}`
  const isNew = !!item?.newArtist
  const isCancelled = item?.status === "CANCELLED"

  const pickArtist = (
    artist: { id: string; name: string; imageUrl: string } | null
  ) => {
    setValue(`lineup.${index}.artistId`, artist?.id ?? null)
    setValue(`lineup.${index}.newArtist`, null)
    setValue(`lineup.${index}.artistImageUrl`, artist?.imageUrl ?? "")
    setValue(`lineup.${index}.artistName`, artist?.name ?? "", {
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
          data-invalid={!!errors?.artistName}
          className="min-w-0 flex-1 gap-1.5"
        >
          {isNew && item.newArtist ? (
            <div className="flex h-9 items-center gap-2">
              <ArtistAvatar
                name={item.newArtist.name}
                imageUrl={item.newArtist.image?.url}
                size="sm"
              />
              <span className="truncate font-medium">
                {item.newArtist.name}
              </span>
              <Badge variant="secondary" className="gap-1">
                <SparklesIcon />
                Novo
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Editar artista novo"
                onClick={() => onCreateArtist(index)}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => pickArtist(null)}
              >
                Trocar
              </Button>
            </div>
          ) : (
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
              invalid={!!errors?.artistName}
            />
          )}
          <FieldError errors={[errors?.artistName]} />
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
          data-invalid={!!errors?.stage}
          className="col-span-2 gap-1.5 md:col-span-1"
        >
          <FieldLabel htmlFor={`${prefix}-stage`}>Palco</FieldLabel>
          <Input
            id={`${prefix}-stage`}
            placeholder="Main Stage"
            aria-invalid={!!errors?.stage}
            {...register(`lineup.${index}.stage`)}
          />
          <FieldError errors={[errors?.stage]} />
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

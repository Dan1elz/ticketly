import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react"
import { useFormContext, useFormState } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EventFormData } from "@/schemas"

export function StageItem({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  const { control, register } = useFormContext<EventFormData>()
  const { errors: formErrors } = useFormState({ control, name: "stages" })
  const errors = formErrors.stages?.[index]

  const prefix = `stage-${index}`
  const isOnly = total === 1

  return (
    <div className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>

        <Field data-invalid={!!errors?.name} className="min-w-0 flex-1 gap-1.5">
          <Input
            id={`${prefix}-name`}
            aria-label={`Nome do palco ${index + 1}`}
            placeholder="Palco principal"
            aria-invalid={!!errors?.name}
            {...register(`stages.${index}.name`)}
          />
          <FieldError errors={[errors?.name]} />
        </Field>

        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Subir palco"
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
                  aria-label="Descer palco"
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
                <span className="inline-flex" tabIndex={isOnly ? 0 : -1} />
              }
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remover palco"
                className="text-destructive"
                disabled={isOnly}
                onClick={() => onRemove(index)}
              >
                <Trash2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isOnly ? "O show precisa de ao menos um palco" : "Remover palco"}
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>

      <Field data-invalid={!!errors?.description} className="gap-1.5 pl-9">
        <Input
          id={`${prefix}-description`}
          aria-label={`Descrição do palco ${index + 1}`}
          placeholder="Descrição (opcional)"
          aria-invalid={!!errors?.description}
          {...register(`stages.${index}.description`)}
        />
        <FieldError errors={[errors?.description]} />
      </Field>
    </div>
  )
}

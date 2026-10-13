import { useState } from "react"
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { seatNoteSchema, type SeatNoteFormData } from "@/schemas"

export type TNoteMode = "block" | "cancel"

const TEXTS: Record<
  TNoteMode,
  { title: string; description: string; confirm: string; placeholder: string }
> = {
  block: {
    title: "Bloquear",
    description:
      "Assento bloqueado sai de venda até ser desbloqueado. Registre o motivo para a equipe saber depois.",
    confirm: "Bloquear",
    placeholder: "Reservado para a produção",
  },
  cancel: {
    title: "Cancelar",
    description:
      "Cancelar é definitivo: o assento nunca volta a ser vendido. Use para assentos criados por engano. Para tirar de venda só por um tempo, bloqueie.",
    confirm: "Cancelar assentos",
    placeholder: "Criado por engano",
  },
}

export function SeatNoteDialog({
  open,
  mode,
  count,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  mode: TNoteMode
  count: number
  onOpenChange: (open: boolean) => void
  onConfirm: (
    mode: TNoteMode,
    note: string,
    onProgress: (processed: number, total: number) => void
  ) => Promise<void>
}) {
  const texts = TEXTS[mode]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {texts.title} {count} assento{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>
        <NoteForm
          mode={mode}
          count={count}
          onCancel={() => onOpenChange(false)}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}

function NoteForm({
  mode,
  count,
  onCancel,
  onConfirm,
}: {
  mode: TNoteMode
  count: number
  onCancel: () => void
  onConfirm: (
    mode: TNoteMode,
    note: string,
    onProgress: (processed: number, total: number) => void
  ) => Promise<void>
}) {
  const texts = TEXTS[mode]
  const [progress, setProgress] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeatNoteFormData>({
    resolver: zodResolver(seatNoteSchema),
    defaultValues: { note: "" },
  })

  const submit = ({ note }: SeatNoteFormData) =>
    onConfirm(mode, note.trim(), (processed) => setProgress(processed))

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="contents">
      <Field data-invalid={!!errors.note}>
        <FieldLabel htmlFor="seat-note">Observação</FieldLabel>
        <Textarea
          id="seat-note"
          rows={3}
          autoFocus
          placeholder={texts.placeholder}
          aria-invalid={!!errors.note}
          {...register("note")}
        />
        <FieldDescription>
          Obrigatória. Fica registrada em cada assento, com quem fez e quando.
        </FieldDescription>
        <FieldError errors={[errors.note]} />
      </Field>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Voltar
        </Button>
        <Button
          type="submit"
          variant={mode === "cancel" ? "destructive" : "default"}
          disabled={isSubmitting}
        >
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting && count > 1
            ? `${progress ?? 0} de ${count}`
            : texts.confirm}
        </Button>
      </DialogFooter>
    </form>
  )
}

import { useRef, useState, type DragEvent } from "react"
import { ImageUpIcon, RefreshCwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants"
import type { IUploadedFile } from "@/interfaces"
import { cn } from "@/lib/utils"
import { handleError, handleWarning } from "@/utils"

/**
 * Sobe a imagem assim que o arquivo é escolhido (ou arrastado) e devolve a
 * chave do MinIO pro formulário. O formulário só guarda `{ key, url }`.
 */
export function ImageUpload({
  id,
  value,
  onChange,
  onUpload,
  invalid,
  className,
}: {
  id?: string
  value: IUploadedFile | null
  onChange: (value: IUploadedFile | null) => void
  onUpload: (file: File) => Promise<IUploadedFile>
  invalid?: boolean
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      handleWarning("Use uma imagem JPG, PNG ou WebP")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      handleWarning("A imagem deve ter no máximo 5 MB")
      return
    }

    setUploading(true)

    try {
      onChange(await onUpload(file))
    } catch (error) {
      handleError(error, "Não foi possível enviar a imagem")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragging(false)
    void upload(event.dataTransfer.files[0])
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void upload(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={openPicker}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        aria-invalid={invalid}
        className={cn(
          "group/upload relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-input/30 transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-wait aria-invalid:border-destructive",
          dragging && "border-primary bg-primary/5",
          value && "border-solid"
        )}
      >
        {value ? (
          <>
            <img
              src={value.url}
              alt="Foto do artista"
              className="size-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover/upload:opacity-100">
              Trocar foto
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImageUpIcon className="size-5" />
            </span>
            <span className="text-sm font-medium">
              Clique ou arraste uma foto
            </span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG ou WebP · até 5 MB
            </span>
          </span>
        )}

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Spinner className="size-6" />
          </span>
        )}
      </button>

      {value && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={uploading}
            onClick={openPicker}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Trocar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => onChange(null)}
          >
            <Trash2Icon data-icon="inline-start" />
            Remover
          </Button>
        </div>
      )}
    </div>
  )
}

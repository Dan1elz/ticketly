import { useState } from "react"
import { UserPlusIcon } from "lucide-react"

import { ArtistAvatar } from "@/components/app/artist-avatar"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useArtists } from "@/hooks/use-artists"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import type { IArtist } from "@/interfaces"
import { cn } from "@/lib/utils"
import { handleError } from "@/utils"

export type TPickedArtist = Pick<IArtist, "id" | "name" | "imageUrl">

/**
 * Busca artistas ativos na API conforme digita (o provider guarda cada busca,
 * então repetir um termo não faz requisição). `onCreateNew` mostra o botão
 * "Cadastrar novo artista" no fim da lista.
 */
export function ArtistPicker({
  id,
  value,
  onChange,
  onCreateNew,
  invalid,
  clearable,
  placeholder = "Buscar artista...",
  className,
}: {
  id?: string
  value: TPickedArtist | null
  onChange: (artist: TPickedArtist | null) => void
  onCreateNew?: () => void
  invalid?: boolean
  clearable?: boolean
  placeholder?: string
  className?: string
}) {
  const { lookupArtists } = useArtists()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TPickedArtist[]>([])
  const [loading, setLoading] = useState(false)

  const search = (term: string) => {
    setLoading(true)
    lookupArtists(term)
      .then(setItems)
      .catch((error) => handleError(error, "Não foi possível buscar artistas"))
      .finally(() => setLoading(false))
  }

  const debouncedSearch = useDebouncedCallback(search, 300)

  return (
    <Combobox<TPickedArtist>
      items={items}
      filter={null}
      value={value}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) search("")
      }}
      onValueChange={(artist) => onChange(artist)}
      onInputValueChange={(term, details) => {
        if (details.reason === "input-change") debouncedSearch(term)
      }}
      itemToStringLabel={(artist) => artist.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        showClear={clearable && !!value}
        aria-invalid={invalid}
        className={cn("w-full", className)}
      >
        {value && (
          <InputGroupAddon>
            <ArtistAvatar
              name={value.name}
              imageUrl={value.imageUrl}
              size="sm"
              className="size-5"
            />
          </InputGroupAddon>
        )}
      </ComboboxInput>

      <ComboboxContent>
        <ComboboxEmpty>
          {loading ? <Spinner /> : "Nenhum artista ativo encontrado."}
        </ComboboxEmpty>
        <ComboboxList>
          {(artist: TPickedArtist) => (
            <ComboboxItem key={artist.id} value={artist}>
              <ArtistAvatar
                name={artist.name}
                imageUrl={artist.imageUrl}
                size="sm"
              />
              <span className="truncate">{artist.name}</span>
            </ComboboxItem>
          )}
        </ComboboxList>

        {onCreateNew && (
          <>
            <Separator />
            <div className="p-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  onCreateNew()
                }}
              >
                <UserPlusIcon data-icon="inline-start" />
                Cadastrar novo artista
              </Button>
            </div>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

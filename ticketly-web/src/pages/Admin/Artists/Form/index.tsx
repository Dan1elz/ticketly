import { useEffect, useState } from "react"
import { ArrowLeftIcon, SaveIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ArtistForm } from "@/components/app/artist-form"
import { ListError } from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useArtists } from "@/hooks/use-artists"
import {
  artistToForm,
  emptyArtistForm,
  formToArtistPayload,
  type ArtistFormOutput,
} from "@/schemas"
import { handleError, handleSuccess } from "@/utils"

export function ArtistFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedArtist, selectArtist, createArtist, updateArtist } =
    useArtists()
  const [loadError, setLoadError] = useState(false)
  const isEdit = !!id

  // Veio da lista: o provider já tem o artista e não faz requisição
  useEffect(() => {
    if (!id) return

    selectArtist(id)
      .then(() => setLoadError(false))
      .catch(() => setLoadError(true))
  }, [id, selectArtist])

  const artist = isEdit && selectedArtist?.id === id ? selectedArtist : null

  const handleSubmit = async (data: ArtistFormOutput) => {
    try {
      if (id) {
        await updateArtist(id, {
          ...formToArtistPayload(data),
          isActive: data.isActive,
        })
        handleSuccess("Artista atualizado")
      } else {
        await createArtist(formToArtistPayload(data))
        handleSuccess("Artista cadastrado")
      }

      navigate("/admin/artistas")
    } catch (err) {
      handleError(err, "Não foi possível salvar o artista")
    }
  }

  const header = (
    <PageHeader
      title={isEdit ? (artist?.name ?? "Editar artista") : "Novo artista"}
      description={
        isEdit
          ? "Atualize os dados do artista."
          : "Cadastre um artista pra usar no lineup dos shows."
      }
      actions={
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link to="/admin/artistas" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Voltar
        </Button>
      }
    />
  )

  if (isEdit && loadError) {
    return (
      <>
        {header}
        <ListError
          onRetry={() =>
            id &&
            selectArtist(id)
              .then(() => setLoadError(false))
              .catch(() => setLoadError(true))
          }
        />
      </>
    )
  }

  if (isEdit && !artist) {
    return (
      <>
        {header}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-112 rounded-4xl" />
          <Skeleton className="h-96 rounded-4xl" />
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      <ArtistForm
        key={artist?.id ?? "new"}
        defaultValues={artist ? artistToForm(artist) : emptyArtistForm}
        onSubmit={handleSubmit}
        showActiveToggle={isEdit}
        renderActions={({ isSubmitting }) => (
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {isEdit ? "Salvar alterações" : "Cadastrar artista"}
            </Button>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/admin/artistas" />}
            >
              Cancelar
            </Button>
          </div>
        )}
      />
    </>
  )
}

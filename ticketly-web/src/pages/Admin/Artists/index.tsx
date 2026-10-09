import { useEffect, useState } from "react"
import {
  EllipsisIcon,
  MicVocalIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ArtistAvatar } from "@/components/app/artist-avatar"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { ListPagination } from "@/components/app/list-pagination"
import {
  ListEmpty,
  ListError,
  ListNoResults,
  TableRowsSkeleton,
} from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ACTIVE_FILTER_LABELS } from "@/constants"
import { useArtists } from "@/hooks/use-artists"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { useListParams } from "@/hooks/use-list-params"
import type { IArtist } from "@/interfaces"
import { cn } from "@/lib/utils"
import { formatDateOnly, handleError, handleSuccess } from "@/utils"

const COLUMNS = 5

export function ArtistList() {
  const {
    artists,
    total,
    loading,
    error,
    searchArtists,
    reloadArtists,
    updateArtist,
    deleteArtist,
  } = useArtists()
  const navigate = useNavigate()
  const {
    page,
    perPage,
    filters,
    setFilter,
    setPage,
    clearFilters,
    hasFilters,
  } = useListParams(["search", "isActive"])

  const [search, setSearch] = useState(filters.search)
  const [toDelete, setToDelete] = useState<IArtist | null>(null)

  const updateSearch = useDebouncedCallback((value: string) =>
    setFilter("search", value.trim())
  )

  const queryKey = JSON.stringify({ page, perPage, filters })

  useEffect(() => {
    searchArtists(JSON.parse(queryKey)).catch((err) =>
      handleError(err, "Não foi possível carregar os artistas")
    )
  }, [queryKey, searchArtists])

  const handleToggleActive = async (artist: IArtist) => {
    try {
      await updateArtist(artist.id, { isActive: !artist.isActive })
      handleSuccess(
        artist.isActive
          ? `${artist.name} foi desativado`
          : `${artist.name} foi ativado`
      )
    } catch (err) {
      handleError(err, "Não foi possível alterar o artista")
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    try {
      await deleteArtist(toDelete.id)
      handleSuccess(`${toDelete.name} foi excluído`)
    } catch (err) {
      handleError(err, "Não foi possível excluir o artista")
      throw err
    }
  }

  const handleClearFilters = () => {
    setSearch("")
    clearFilters()
  }

  const isFirstLoad = loading && artists.length === 0
  const isEmpty = !loading && !error && artists.length === 0

  return (
    <>
      <PageHeader
        title="Artistas"
        description="Quem sobe ao palco nos shows do Ticketly."
        actions={
          <Button
            nativeButton={false}
            render={<Link to="/admin/artistas/novo" />}
          >
            <PlusIcon data-icon="inline-start" />
            Novo artista
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <InputGroup className="sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Buscar por nome ou nome civil..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              updateSearch(event.target.value)
            }}
          />
        </InputGroup>

        <Select
          items={ACTIVE_FILTER_LABELS}
          value={filters.isActive || "all"}
          onValueChange={(value) =>
            setFilter("isActive", value === "all" ? "" : String(value))
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {Object.entries(ACTIVE_FILTER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ListError onRetry={() => void reloadArtists()} />
      ) : isEmpty && hasFilters ? (
        <ListNoResults onClear={handleClearFilters} />
      ) : isEmpty ? (
        <ListEmpty
          icon={<MicVocalIcon />}
          title="Nenhum artista ainda"
          description="Cadastre o primeiro artista pra montar o lineup dos shows."
          action={
            <Button
              nativeButton={false}
              render={<Link to="/admin/artistas/novo" />}
            >
              <PlusIcon data-icon="inline-start" />
              Novo artista
            </Button>
          }
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 sm:pl-6">Artista</TableHead>
                  <TableHead className="hidden sm:table-cell">Gênero</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Cadastrado em
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10 pr-4 sm:w-12 sm:pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody
                className={cn(
                  loading && !isFirstLoad && "opacity-60 transition-opacity"
                )}
              >
                {isFirstLoad ? (
                  <TableRowsSkeleton columns={COLUMNS} />
                ) : (
                  artists.map((artist) => (
                    <TableRow
                      key={artist.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/artistas/${artist.id}`)}
                    >
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <ArtistAvatar
                            name={artist.name}
                            imageUrl={artist.imageUrl}
                            size="lg"
                          />
                          <div className="flex max-w-36 min-w-0 flex-col sm:max-w-none">
                            <span className="truncate font-medium">
                              {artist.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {artist.legalName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{artist.genre}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDateOnly(artist.createdAt)}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={artist.isActive} />
                      </TableCell>
                      <TableCell
                        className="pr-4 sm:pr-6"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Ações de ${artist.name}`}
                              />
                            }
                          >
                            <EllipsisIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              render={
                                <Link to={`/admin/artistas/${artist.id}`} />
                              }
                            >
                              <PencilIcon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(artist)}
                            >
                              {artist.isActive ? (
                                <PowerOffIcon />
                              ) : (
                                <PowerIcon />
                              )}
                              {artist.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setToDelete(artist)}
                            >
                              <Trash2Icon />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {artists.length > 0 && !error && (
        <ListPagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          itemLabel="artistas"
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Excluir ${toDelete?.name ?? "artista"}?`}
        description="Essa ação não pode ser desfeita. Artistas que já estão no lineup de algum show não podem ser excluídos — desative-os."
        onConfirm={handleDelete}
      />
    </>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "secondary" : "outline"} className="gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/50"
        )}
      />
      {active ? "Ativo" : "Inativo"}
    </Badge>
  )
}

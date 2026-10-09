import { useEffect, useState } from "react"
import {
  CalendarDaysIcon,
  EllipsisIcon,
  EyeOffIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { ArtistAvatar } from "@/components/app/artist-avatar"
import {
  ArtistPicker,
  type TPickedArtist,
} from "@/components/app/artist-picker"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { ListPagination } from "@/components/app/list-pagination"
import {
  ListEmpty,
  ListError,
  ListNoResults,
  TableRowsSkeleton,
} from "@/components/app/list-states"
import { EventStatusBadge } from "@/components/app/event-status-badge"
import { PageHeader } from "@/components/app/page-header"
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EVENT_STATUS_LABELS } from "@/constants"
import { useArtists } from "@/hooks/use-artists"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { useEvents } from "@/hooks/use-events"
import { useListParams } from "@/hooks/use-list-params"
import type { IEvent, TEventStatus } from "@/interfaces"
import { cn } from "@/lib/utils"
import { formatTime, handleError, handleSuccess } from "@/utils"

const COLUMNS = 5
const MAX_AVATARS = 3

const STATUS_FILTER_LABELS = { all: "Todos os status", ...EVENT_STATUS_LABELS }

export function EventList() {
  const {
    events,
    total,
    loading,
    error,
    searchEvents,
    reloadEvents,
    updateEvent,
    deleteEvent,
  } = useEvents()
  const { getArtist } = useArtists()
  const navigate = useNavigate()
  const {
    page,
    perPage,
    filters,
    setFilter,
    setPage,
    clearFilters,
    hasFilters,
  } = useListParams(["search", "status", "artistId"])

  const [search, setSearch] = useState(filters.search)
  const [toDelete, setToDelete] = useState<IEvent | null>(null)
  const [filterArtist, setFilterArtist] = useState<TPickedArtist | null>(null)

  const updateSearch = useDebouncedCallback((value: string) =>
    setFilter("search", value.trim())
  )

  const queryKey = JSON.stringify({ page, perPage, filters })

  useEffect(() => {
    searchEvents(JSON.parse(queryKey)).catch((err) =>
      handleError(err, "Não foi possível carregar os shows")
    )
  }, [queryKey, searchEvents])

  // Filtro vindo da URL (?artistId=...): busca o nome pra mostrar no campo
  useEffect(() => {
    if (!filters.artistId) return

    getArtist(filters.artistId)
      .then(setFilterArtist)
      .catch(() => setFilterArtist(null))
  }, [filters.artistId, getArtist])

  const pickedArtist =
    filters.artistId && filterArtist?.id === filters.artistId
      ? filterArtist
      : null

  const handleToggleStatus = async (event: IEvent) => {
    const status: TEventStatus =
      event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"

    try {
      await updateEvent(event.id, { status })
      handleSuccess(
        status === "PUBLISHED"
          ? `${event.name} foi publicado`
          : `${event.name} voltou para rascunho`
      )
    } catch (err) {
      handleError(err, "Não foi possível alterar o status")
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return

    try {
      await deleteEvent(toDelete.id)
      handleSuccess(`${toDelete.name} foi excluído`)
    } catch (err) {
      handleError(err, "Não foi possível excluir o show")
      throw err
    }
  }

  const handleClearFilters = () => {
    setSearch("")
    clearFilters()
  }

  const isFirstLoad = loading && events.length === 0
  const isEmpty = !loading && !error && events.length === 0

  return (
    <>
      <PageHeader
        title="Shows"
        description="Eventos, datas e o lineup de cada um."
        actions={
          <Button nativeButton={false} render={<Link to="/admin/shows/novo" />}>
            <PlusIcon data-icon="inline-start" />
            Novo show
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <InputGroup className="lg:max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Buscar por nome ou local..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              updateSearch(event.target.value)
            }}
          />
        </InputGroup>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            items={STATUS_FILTER_LABELS}
            value={filters.status || "all"}
            onValueChange={(value) =>
              setFilter("status", value === "all" ? "" : String(value))
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {Object.entries(STATUS_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArtistPicker
            value={pickedArtist}
            onChange={(artist) => {
              setFilterArtist(artist)
              setFilter("artistId", artist?.id ?? "")
            }}
            clearable
            placeholder="Filtrar por artista"
            className="sm:w-64"
          />
        </div>
      </div>

      {error ? (
        <ListError onRetry={() => void reloadEvents()} />
      ) : isEmpty && hasFilters ? (
        <ListNoResults onClear={handleClearFilters} />
      ) : isEmpty ? (
        <ListEmpty
          icon={<CalendarDaysIcon />}
          title="Nenhum show ainda"
          description="Crie o primeiro show e monte o lineup com os artistas."
          action={
            <Button
              nativeButton={false}
              render={<Link to="/admin/shows/novo" />}
            >
              <PlusIcon data-icon="inline-start" />
              Novo show
            </Button>
          }
        />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 sm:pl-6">Show</TableHead>
                  <TableHead className="hidden md:table-cell">Lineup</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Horário
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
                  events.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/shows/${event.id}`)}
                    >
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <DateTile date={event.startsAt} />
                          <div className="flex max-w-36 min-w-0 flex-col gap-0.5 sm:max-w-none">
                            <span className="truncate font-medium">
                              {event.name}
                            </span>
                            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPinIcon className="size-3 shrink-0" />
                              {event.venue}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <LineupAvatars event={event} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {formatTime(event.startsAt)}
                      </TableCell>
                      <TableCell>
                        <EventStatusBadge status={event.status} />
                      </TableCell>
                      <TableCell
                        className="pr-4 sm:pr-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Ações de ${event.name}`}
                              />
                            }
                          >
                            <EllipsisIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              render={<Link to={`/admin/shows/${event.id}`} />}
                            >
                              <PencilIcon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(event)}
                            >
                              {event.status === "PUBLISHED" ? (
                                <EyeOffIcon />
                              ) : (
                                <SendIcon />
                              )}
                              {event.status === "PUBLISHED"
                                ? "Voltar para rascunho"
                                : "Publicar"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setToDelete(event)}
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

      {events.length > 0 && !error && (
        <ListPagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          itemLabel="shows"
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Excluir ${toDelete?.name ?? "show"}?`}
        description="O show e o lineup dele serão apagados. Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  )
}

function DateTile({ date }: { date: string }) {
  const value = new Date(date)
  const month = value
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")

  return (
    <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border bg-muted/40 leading-none">
      <span className="text-[10px] font-medium text-primary uppercase">
        {month}
      </span>
      <span className="text-base font-semibold">{value.getDate()}</span>
    </div>
  )
}

function LineupAvatars({ event }: { event: IEvent }) {
  const visible = event.lineup.slice(0, MAX_AVATARS)
  const rest = event.lineup.length - visible.length

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <AvatarGroup>
          {visible.map((item) => (
            <ArtistAvatar
              key={item.id}
              name={item.artist.name}
              imageUrl={item.artist.imageUrl}
            />
          ))}
          {rest > 0 && <AvatarGroupCount>+{rest}</AvatarGroupCount>}
        </AvatarGroup>
      </TooltipTrigger>
      <TooltipContent>
        {event.lineup.map((item) => item.artist.name).join(", ")}
      </TooltipContent>
    </Tooltip>
  )
}

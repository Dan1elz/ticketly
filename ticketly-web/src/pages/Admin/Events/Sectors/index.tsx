import { useEffect, useState } from "react"
import {
  ArmchairIcon,
  ArrowLeftIcon,
  BanIcon,
  InfoIcon,
  PlusIcon,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EventStatusBadge } from "@/components/app/event-status-badge"
import { ListEmpty, ListError } from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvents } from "@/hooks/use-events"
import { useSectors } from "@/hooks/use-sectors"
import type { ISector, TSeatCounts } from "@/interfaces"
import { handleError, handleSuccess } from "@/utils"
import { SectorCard } from "./components/sector-card"
import { SectorFormDialog } from "./components/sector-form-dialog"
import { SeatCountsBar } from "./components/seat-status"

const EMPTY_COUNTS: TSeatCounts = {
  AVAILABLE: 0,
  RESERVED: 0,
  SOLD: 0,
  BLOCKED: 0,
  CANCELLED: 0,
  total: 0,
}

function sumCounts(sectors: ISector[]): TSeatCounts {
  return sectors.reduce<TSeatCounts>(
    (sum, sector) => ({
      AVAILABLE: sum.AVAILABLE + sector.seatCounts.AVAILABLE,
      RESERVED: sum.RESERVED + sector.seatCounts.RESERVED,
      SOLD: sum.SOLD + sector.seatCounts.SOLD,
      BLOCKED: sum.BLOCKED + sector.seatCounts.BLOCKED,
      CANCELLED: sum.CANCELLED + sector.seatCounts.CANCELLED,
      total: sum.total + sector.seatCounts.total,
    }),
    EMPTY_COUNTS
  )
}

export function SectorsPage() {
  const { id: eventId } = useParams()
  const { selectedEvent, selectEvent } = useEvents()
  const { sectors, sectorsEventId, sectorsError, loadSectors, deleteSector } =
    useSectors()

  const [eventError, setEventError] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ISector | null>(null)
  const [toDelete, setToDelete] = useState<ISector | null>(null)

  useEffect(() => {
    if (!eventId) return

    selectEvent(eventId)
      .then(() => setEventError(false))
      .catch(() => setEventError(true))
  }, [eventId, selectEvent])

  // Sempre busca de novo: as contagens mudam com reservas e vendas
  useEffect(() => {
    if (!eventId) return

    loadSectors(eventId).catch(() => undefined)
  }, [eventId, loadSectors])

  const event = selectedEvent?.id === eventId ? selectedEvent : null
  const eventSectors = sectorsEventId === eventId ? sectors : null
  const cancelled = event?.status === "CANCELLED"
  const counts = eventSectors ? sumCounts(eventSectors) : EMPTY_COUNTS
  const nextOrder =
    (eventSectors?.reduce((max, s) => Math.max(max, s.displayOrder), 0) ?? 0) +
    1

  const retry = () => {
    if (!eventId) return

    setEventError(false)
    selectEvent(eventId).catch(() => setEventError(true))
    loadSectors(eventId).catch(() => undefined)
  }

  const openForm = (sector: ISector | null) => {
    setEditing(sector)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!toDelete) return

    try {
      await deleteSector(toDelete.id)
      handleSuccess(`${toDelete.name} foi excluído`)
    } catch (err) {
      handleError(err, "Não foi possível excluir o setor")
      throw err
    }
  }

  const header = (
    <PageHeader
      title="Setores e assentos"
      description={
        event ? (
          <span className="flex flex-wrap items-center gap-2">
            {event.name}
            <EventStatusBadge status={event.status} />
          </span>
        ) : (
          "Preços, tipos e ingressos de cada setor do show."
        )
      }
      actions={
        <>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link to={`/admin/shows/${eventId}`} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar ao show
          </Button>
          {!cancelled && (
            <Button onClick={() => openForm(null)}>
              <PlusIcon data-icon="inline-start" />
              Novo setor
            </Button>
          )}
        </>
      }
    />
  )

  if (!eventId) return null

  if ((sectorsError && !eventSectors) || eventError) {
    return (
      <>
        {header}
        <ListError onRetry={retry} />
      </>
    )
  }

  if (!eventSectors || !event) {
    return (
      <>
        {header}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-56 rounded-4xl" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      {header}

      {cancelled && (
        <Alert variant="destructive">
          <BanIcon />
          <AlertTitle>Show cancelado</AlertTitle>
          <AlertDescription>
            Os setores e os assentos de um show cancelado não podem mais ser
            alterados.
          </AlertDescription>
        </Alert>
      )}

      {!cancelled &&
        event.status === "DRAFT" &&
        eventSectors.length > 0 &&
        counts.AVAILABLE === 0 && (
          <Alert>
            <InfoIcon />
            <AlertTitle>Ainda não dá para publicar</AlertTitle>
            <AlertDescription>
              O show só pode ser publicado com ao menos um ingresso disponível.
              Gere assentos em algum setor.
            </AlertDescription>
          </Alert>
        )}

      {eventSectors.length === 0 ? (
        <ListEmpty
          icon={<ArmchairIcon />}
          title="Nenhum setor ainda"
          description="Crie os setores do show (pista, cadeira, camarote...) e depois gere os assentos de cada um."
          action={
            !cancelled && (
              <Button onClick={() => openForm(null)}>
                <PlusIcon data-icon="inline-start" />
                Novo setor
              </Button>
            )
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Visão geral</CardTitle>
              <CardDescription>
                Soma dos {eventSectors.length} setor
                {eventSectors.length === 1 ? "" : "es"} do show.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeatCountsBar counts={counts} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {eventSectors.map((sector) => (
              <SectorCard
                key={sector.id}
                sector={sector}
                eventId={eventId}
                readOnly={cancelled}
                onEdit={openForm}
                onDelete={setToDelete}
              />
            ))}
          </div>
        </>
      )}

      <SectorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventId={eventId}
        sector={editing}
        nextOrder={nextOrder}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Excluir ${toDelete?.name ?? "setor"}?`}
        description="O setor será apagado. Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
      />
    </>
  )
}

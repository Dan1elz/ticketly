import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AccessibilityIcon,
  ArmchairIcon,
  ArrowLeftIcon,
  BanIcon,
  LockIcon,
  LockOpenIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { ListEmpty, ListError } from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { SECTOR_TYPE_LABELS, SEAT_STATUS_LABELS } from "@/constants"
import { useEvents } from "@/hooks/use-events"
import { useSectors } from "@/hooks/use-sectors"
import type { ISeat, TSeatAction } from "@/interfaces"
import { formatCents, formatDateTime, formatNumber, handleError } from "@/utils"
import { reportSeatBatch } from "../components/seat-batch-report"
import { isSeatActionable, seatLabel } from "../components/seat.helpers"
import { SeatCountsBar, SeatStatusDot } from "../components/seat-status"
import { GeneralAdmissionPanel } from "./components/general-admission-panel"
import { SeatBlockDialog } from "./components/seat-block-dialog"
import { SeatLegend, SeatMap } from "./components/seat-map"
import { SeatNoteDialog, type TNoteMode } from "./components/seat-note-dialog"
import { SeatQuantityDialog } from "./components/seat-quantity-dialog"

const DEFAULT_CELL_SIZE = 36

export function SeatsPage() {
  const { id: eventId, sectorId } = useParams()
  const { selectedEvent, selectEvent } = useEvents()
  const {
    sectors,
    sectorsEventId,
    sectorsError,
    loadSectors,
    seats,
    seatsSectorId,
    seatsError,
    loadSeats,
    changeSeats,
  } = useSectors()

  const [eventError, setEventError] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE)
  const [busy, setBusy] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState<{ mode: TNoteMode; count: number }>({
    mode: "block",
    count: 0,
  })

  const event = selectedEvent?.id === eventId ? selectedEvent : null
  const eventSectors = sectorsEventId === eventId ? sectors : null
  const sector = eventSectors?.find((item) => item.id === sectorId) ?? null
  const isSeated = sector?.type === "SEATED"
  const cancelled = event?.status === "CANCELLED"
  const sectorSeats = seatsSectorId === sectorId ? seats : null

  useEffect(() => {
    if (!eventId) return

    selectEvent(eventId)
      .then(() => setEventError(false))
      .catch(() => setEventError(true))
  }, [eventId, selectEvent])

  useEffect(() => {
    if (!eventId) return

    loadSectors(eventId).catch(() => undefined)
  }, [eventId, loadSectors])

  // Pista não precisa da lista (só dos contadores): ela busca na hora de aplicar
  useEffect(() => {
    if (!sectorId || !isSeated) return

    loadSeats(sectorId).catch(() => undefined)
  }, [sectorId, isSeated, loadSeats])

  const selectedSeats = useMemo(
    () => (sectorSeats ?? []).filter((seat) => selected.has(seat.id)),
    [sectorSeats, selected]
  )
  const toBlock = selectedSeats.filter((seat) => seat.status === "AVAILABLE")
  const toUnblock = selectedSeats.filter((seat) => seat.status === "BLOCKED")
  const inspected = sectorSeats?.find((seat) => seat.id === inspectedId) ?? null

  const selectSeat = useCallback(
    (seat: ISeat) => {
      setInspectedId(seat.id)
      if (cancelled || !isSeatActionable(seat)) return

      setSelected((current) => {
        const next = new Set(current)

        if (next.has(seat.id)) next.delete(seat.id)
        else next.add(seat.id)

        return next
      })
    },
    [cancelled]
  )

  const selectRow = (gridRow: number) => {
    if (cancelled) return

    const row = (sectorSeats ?? []).filter(
      (seat) => seat.gridRow === gridRow && isSeatActionable(seat)
    )
    if (row.length === 0) return

    setSelected((current) => {
      const next = new Set(current)
      const allSelected = row.every((seat) => next.has(seat.id))

      row.forEach((seat) =>
        allSelected ? next.delete(seat.id) : next.add(seat.id)
      )
      return next
    })
  }

  const runBatch = async (
    action: TSeatAction,
    targets: ISeat[],
    noteText: string | null,
    onProgress?: (processed: number, total: number) => void
  ) => {
    if (!sectorId || !eventId) return

    setBusy(true)

    try {
      const result = await changeSeats(
        action,
        targets.map((seat) => seat.id),
        noteText,
        onProgress
      )

      reportSeatBatch(action, result)
      if (result.done > 0) setSelected(new Set())

      // Falha parcial: algo mudou do outro lado (reserva, outro admin)
      if (result.failed > 0) {
        loadSeats(sectorId).catch(() => undefined)
        loadSectors(eventId).catch(() => undefined)
      }
    } catch (err) {
      handleError(err, "Não foi possível alterar os assentos")
    } finally {
      setBusy(false)
    }
  }

  const openNote = (mode: TNoteMode) => {
    setNote({ mode, count: toBlock.length })
    setNoteOpen(true)
  }

  const confirmNote = async (
    mode: TNoteMode,
    text: string,
    onProgress: (processed: number, total: number) => void
  ) => {
    await runBatch(mode, toBlock, text, onProgress)
    setNoteOpen(false)
  }

  const retry = () => {
    if (!eventId) return

    setEventError(false)
    selectEvent(eventId).catch(() => setEventError(true))
    loadSectors(eventId).catch(() => undefined)
    if (sectorId && isSeated) loadSeats(sectorId).catch(() => undefined)
  }

  const backLink = (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link to={`/admin/shows/${eventId}/setores`} />}
    >
      <ArrowLeftIcon data-icon="inline-start" />
      Voltar aos setores
    </Button>
  )

  if (!eventId || !sectorId) return null

  if ((sectorsError && !eventSectors) || eventError) {
    return (
      <>
        <PageHeader title="Assentos" actions={backLink} />
        <ListError onRetry={retry} />
      </>
    )
  }

  if (!eventSectors || !event) {
    return (
      <>
        <PageHeader title="Assentos" actions={backLink} />
        <Skeleton className="h-28 rounded-4xl" />
        <Skeleton className="h-96 rounded-4xl" />
      </>
    )
  }

  if (!sector) {
    return (
      <>
        <PageHeader title="Assentos" actions={backLink} />
        <ListEmpty
          icon={<ArmchairIcon />}
          title="Setor não encontrado"
          description="Esse setor não existe neste show. Ele pode ter sido excluído."
        />
      </>
    )
  }

  const { seatCounts } = sector

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span
              className="size-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: sector.color }}
            />
            {sector.name}
          </span>
        }
        description={`${event.name} · ${SECTOR_TYPE_LABELS[sector.type]} · ${formatCents(sector.priceCents)}`}
        actions={
          <>
            {backLink}
            {!cancelled && (
              <Button onClick={() => setGenerateOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                {isSeated ? "Gerar assentos" : "Adicionar ingressos"}
              </Button>
            )}
          </>
        }
      />

      {cancelled && (
        <Alert variant="destructive">
          <BanIcon />
          <AlertTitle>Show cancelado</AlertTitle>
          <AlertDescription>
            Os assentos de um show cancelado não podem mais ser alterados.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {formatNumber(seatCounts.total)} {isSeated ? "assento" : "ingresso"}
            {seatCounts.total === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>Quantidade em cada status.</CardDescription>
        </CardHeader>
        <CardContent>
          <SeatCountsBar counts={seatCounts} />
        </CardContent>
      </Card>

      {!isSeated ? (
        !cancelled &&
        (seatCounts.total > 0 ? (
          <GeneralAdmissionPanel sector={sector} />
        ) : (
          <ListEmpty
            icon={<ArmchairIcon />}
            title="Nenhum ingresso ainda"
            description="A pista não tem lugar marcado: informe quantos ingressos existem."
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Adicionar ingressos
              </Button>
            }
          />
        ))
      ) : seatsError && !sectorSeats ? (
        <ListError onRetry={retry} />
      ) : !sectorSeats ? (
        <Skeleton className="h-96 rounded-4xl" />
      ) : sectorSeats.length === 0 ? (
        <ListEmpty
          icon={<ArmchairIcon />}
          title="Nenhum assento ainda"
          description="Gere blocos de fileiras para montar a grade do setor."
          action={
            !cancelled && (
              <Button onClick={() => setGenerateOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Gerar assentos
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de assentos</CardTitle>
            <CardDescription>
              {cancelled
                ? "Show cancelado: o mapa é só de consulta."
                : "Clique nos assentos para selecionar. Clicar na letra da fileira seleciona a fileira inteira."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SeatLegend />
              <div className="flex w-full items-center gap-3 sm:w-52">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <Slider
                  aria-label="Zoom do mapa"
                  min={20}
                  max={48}
                  step={4}
                  value={[cellSize]}
                  onValueChange={(value) =>
                    setCellSize(Array.isArray(value) ? value[0] : value)
                  }
                />
              </div>
            </div>

            {!cancelled && (
              <SelectionBar
                selected={selectedSeats.length}
                blockable={toBlock.length}
                unblockable={toUnblock.length}
                busy={busy}
                onBlock={() => openNote("block")}
                onCancel={() => openNote("cancel")}
                onUnblock={() => runBatch("unblock", toUnblock, null)}
                onClear={() => setSelected(new Set())}
              />
            )}

            <SeatMap
              seats={sectorSeats}
              selected={selected}
              inspectedId={inspectedId}
              cellSize={cellSize}
              onSelect={selectSeat}
              onSelectRow={selectRow}
            />

            {inspected && <SeatDetails seat={inspected} />}
          </CardContent>
        </Card>
      )}

      {isSeated ? (
        <SeatBlockDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          sectorId={sector.id}
          seats={sectorSeats ?? []}
        />
      ) : (
        <SeatQuantityDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          sectorId={sector.id}
          current={seatCounts.total}
        />
      )}

      <SeatNoteDialog
        open={noteOpen}
        mode={note.mode}
        count={note.count}
        onOpenChange={(open) => !busy && setNoteOpen(open)}
        onConfirm={confirmNote}
      />
    </>
  )
}

function SelectionBar({
  selected,
  blockable,
  unblockable,
  busy,
  onBlock,
  onCancel,
  onUnblock,
  onClear,
}: {
  selected: number
  blockable: number
  unblockable: number
  busy: boolean
  onBlock: () => void
  onCancel: () => void
  onUnblock: () => void
  onClear: () => void
}) {
  if (selected === 0) {
    return (
      <p className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Nenhum assento selecionado. Só assentos disponíveis ou bloqueados podem
        ser alterados.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <span className="font-medium">
          {selected} selecionado{selected === 1 ? "" : "s"}
        </span>
        <span className="text-muted-foreground">
          {" "}
          · {blockable} disponíve{blockable === 1 ? "l" : "is"} · {unblockable}{" "}
          bloqueado{unblockable === 1 ? "" : "s"}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || blockable === 0}
          onClick={onBlock}
        >
          <LockIcon data-icon="inline-start" />
          Bloquear ({blockable})
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || unblockable === 0}
          onClick={onUnblock}
        >
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LockOpenIcon data-icon="inline-start" />
          )}
          Desbloquear ({unblockable})
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          disabled={busy || blockable === 0}
          onClick={onCancel}
        >
          <BanIcon data-icon="inline-start" />
          Cancelar ({blockable})
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onClear}>
          <XIcon data-icon="inline-start" />
          Limpar
        </Button>
      </div>
    </div>
  )
}

function SeatDetails({ seat }: { seat: ISeat }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {seat.row
            ? `Fileira ${seat.row}, número ${seat.number}`
            : `Nº ${seat.number}`}
        </span>
        <span className="text-muted-foreground">({seatLabel(seat)})</span>
        <Badge variant="secondary" className="gap-1.5">
          <SeatStatusDot status={seat.status} className="size-2" />
          {SEAT_STATUS_LABELS[seat.status]}
        </Badge>
        {seat.isAccessible && (
          <Badge variant="outline">
            <AccessibilityIcon />
            PCD
          </Badge>
        )}
      </div>

      {seat.statusNote && (
        <p className="text-muted-foreground">
          Observação: <span className="text-foreground">{seat.statusNote}</span>
        </p>
      )}

      {seat.statusChangedAt && (
        <p className="text-xs text-muted-foreground">
          Alterado
          {seat.statusChangedBy
            ? ` por ${seat.statusChangedBy.name}`
            : ""} em {formatDateTime(seat.statusChangedAt)}
        </p>
      )}
    </div>
  )
}

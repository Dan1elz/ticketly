import { memo, useMemo } from "react"
import { AccessibilityIcon } from "lucide-react"

import { SEAT_STATUS_LABELS, SEAT_STATUSES } from "@/constants"
import type { ISeat } from "@/interfaces"
import { cn } from "@/lib/utils"
import {
  SEAT_CELL_CLASSES,
  isSeatActionable,
  seatLabel,
} from "../../components/seat.helpers"
import { SeatStatusDot } from "../../components/seat-status"

const ROW_LABEL_WIDTH = "2.5rem"
const MIN_SIZE_WITH_NUMBER = 28

type TLayout = {
  cells: ISeat[]
  rows: { gridRow: number; label: string }[]
  maxRow: number
  maxColumn: number
}

// Assento cancelado libera a posição pra um novo: onde os dois existem, o
// que vale pro mapa é o não cancelado
function buildLayout(seats: ISeat[]): TLayout {
  const byCell = new Map<string, ISeat>()

  for (const seat of seats) {
    if (seat.gridRow === null || seat.gridColumn === null) continue

    const key = `${seat.gridRow}:${seat.gridColumn}`
    const current = byCell.get(key)

    if (
      !current ||
      (current.status === "CANCELLED" && seat.status !== "CANCELLED")
    ) {
      byCell.set(key, seat)
    }
  }

  const cells = [...byCell.values()]
  const labels = new Map<number, string>()
  let maxRow = 0
  let maxColumn = 0

  for (const seat of cells) {
    const gridRow = seat.gridRow as number
    const gridColumn = seat.gridColumn as number

    maxRow = Math.max(maxRow, gridRow)
    maxColumn = Math.max(maxColumn, gridColumn)

    if (!labels.has(gridRow) && seat.row) labels.set(gridRow, seat.row)
  }

  const rows = [...labels.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gridRow, label]) => ({ gridRow, label }))

  return { cells, rows, maxRow, maxColumn }
}

const SeatCell = memo(function SeatCell({
  seat,
  selected,
  inspected,
  showNumber,
  onSelect,
}: {
  seat: ISeat
  selected: boolean
  inspected: boolean
  showNumber: boolean
  onSelect: (seat: ISeat) => void
}) {
  const label = `${seat.row ? `Fileira ${seat.row}, ` : ""}número ${seat.number}`

  return (
    <button
      type="button"
      title={`${seatLabel(seat)} · ${SEAT_STATUS_LABELS[seat.status]}${seat.isAccessible ? " · PCD" : ""}`}
      aria-label={`${label}, ${SEAT_STATUS_LABELS[seat.status]}${seat.isAccessible ? ", acessível" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(seat)}
      style={{
        gridRow: seat.gridRow ?? undefined,
        gridColumn: (seat.gridColumn ?? 0) + 1,
      }}
      className={cn(
        "relative flex items-center justify-center rounded-md text-[10px] leading-none font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        SEAT_CELL_CLASSES[seat.status],
        isSeatActionable(seat) ? "cursor-pointer" : "cursor-default",
        selected &&
          "ring-2 ring-foreground ring-offset-1 ring-offset-background",
        inspected && !selected && "ring-2 ring-primary/60"
      )}
    >
      {showNumber && seat.number}
      {seat.isAccessible && (
        <AccessibilityIcon
          className={cn(
            "size-3",
            showNumber ? "absolute top-0.5 right-0.5 size-2.5" : ""
          )}
        />
      )}
    </button>
  )
})

/**
 * Grade do setor como foi montada: cada quadradinho fica na linha e na coluna
 * (`gridRow`/`gridColumn`) do assento, e linhas ou colunas vazias viram
 * corredor.
 */
export function SeatMap({
  seats,
  selected,
  inspectedId,
  cellSize,
  onSelect,
  onSelectRow,
}: {
  seats: ISeat[]
  selected: ReadonlySet<string>
  inspectedId: string | null
  cellSize: number
  onSelect: (seat: ISeat) => void
  onSelectRow: (gridRow: number) => void
}) {
  const layout = useMemo(() => buildLayout(seats), [seats])
  const showNumber = cellSize >= MIN_SIZE_WITH_NUMBER

  return (
    <div className="overflow-auto rounded-2xl border bg-muted/20 p-4">
      <div
        className="grid w-max gap-1"
        style={{
          gridTemplateColumns: `${ROW_LABEL_WIDTH} repeat(${layout.maxColumn}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${layout.maxRow}, ${cellSize}px)`,
        }}
      >
        {layout.rows.map(({ gridRow, label }) => (
          <button
            key={`row-${gridRow}`}
            type="button"
            title={`Selecionar a fileira ${label}`}
            aria-label={`Selecionar a fileira ${label}`}
            onClick={() => onSelectRow(gridRow)}
            style={{ gridRow, gridColumn: 1 }}
            className="rounded-md pr-2 text-right text-xs font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </button>
        ))}

        {layout.cells.map((seat) => (
          <SeatCell
            key={seat.id}
            seat={seat}
            selected={selected.has(seat.id)}
            inspected={inspectedId === seat.id}
            showNumber={showNumber}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {SEAT_STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <SeatStatusDot status={status} />
          {SEAT_STATUS_LABELS[status]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <AccessibilityIcon className="size-3.5" />
        PCD
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 shrink-0 rounded-sm ring-2 ring-foreground ring-offset-1 ring-offset-background" />
        Selecionado
      </li>
    </ul>
  )
}

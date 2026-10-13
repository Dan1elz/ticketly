import { ArmchairIcon, PencilIcon, TicketsIcon, Trash2Icon } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SECTOR_TYPE_LABELS } from "@/constants"
import type { ISector } from "@/interfaces"
import { formatCents, formatNumber } from "@/utils"
import { SeatCountsBar } from "./seat-status"

export function SectorCard({
  sector,
  eventId,
  readOnly,
  onEdit,
  onDelete,
}: {
  sector: ISector
  eventId: string
  readOnly: boolean
  onEdit: (sector: ISector) => void
  onDelete: (sector: ISector) => void
}) {
  const hasSeats = sector.seatCounts.total > 0
  const isSeated = sector.type === "SEATED"

  return (
    <Card className="pt-0">
      <div className="h-1.5 w-full" style={{ backgroundColor: sector.color }} />

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate text-base font-medium">{sector.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">
                {isSeated ? <ArmchairIcon /> : <TicketsIcon />}
                {SECTOR_TYPE_LABELS[sector.type]}
              </Badge>
              {sector.maxPerOrder !== null && (
                <Badge variant="outline">
                  Máx. {sector.maxPerOrder} por pedido
                </Badge>
              )}
            </div>
          </div>
          <span className="shrink-0 text-lg font-semibold tabular-nums">
            {formatCents(sector.priceCents)}
          </span>
        </div>

        {sector.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {sector.description}
          </p>
        )}

        {hasSeats ? (
          <SeatCountsBar counts={sector.seatCounts} />
        ) : (
          <p className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            {isSeated
              ? "Nenhum assento ainda. Gere os blocos de fileiras na grade."
              : "Nenhum ingresso ainda. Informe a quantidade da pista."}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant={hasSeats ? "outline" : "default"}
          nativeButton={false}
          render={<Link to={`/admin/shows/${eventId}/setores/${sector.id}`} />}
        >
          <ArmchairIcon data-icon="inline-start" />
          {isSeated ? "Assentos" : "Ingressos"}
          {hasSeats && (
            <span className="text-muted-foreground tabular-nums">
              {formatNumber(sector.seatCounts.total)}
            </span>
          )}
        </Button>

        {!readOnly && (
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${sector.name}`}
                    onClick={() => onEdit(sector)}
                  />
                }
              >
                <PencilIcon />
              </TooltipTrigger>
              <TooltipContent>Editar setor</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${sector.name}`}
                  className="text-destructive"
                  disabled={hasSeats}
                  onClick={() => onDelete(sector)}
                >
                  <Trash2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasSeats
                  ? "Setor com assentos não pode ser excluído: assento nunca é apagado"
                  : "Excluir setor"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

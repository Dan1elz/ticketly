import { SEAT_STATUS_LABELS, SEAT_STATUSES } from "@/constants"
import type { TSeatCounts, TSeatStatus } from "@/interfaces"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils"
import { SEAT_DOT_CLASSES } from "./seat.helpers"

export function SeatStatusDot({
  status,
  className,
}: {
  status: TSeatStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        SEAT_DOT_CLASSES[status],
        className
      )}
    />
  )
}

/**
 * Barra empilhada com a proporção de cada status e a contagem de cada um.
 */
export function SeatCountsBar({
  counts,
  className,
}: {
  counts: TSeatCounts
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="img"
        aria-label={`${formatNumber(counts.total)} assentos no total`}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        {SEAT_STATUSES.filter((status) => counts[status] > 0).map((status) => (
          <div
            key={status}
            className={SEAT_DOT_CLASSES[status]}
            style={{ flexGrow: counts[status], flexBasis: 0 }}
          />
        ))}
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {SEAT_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <SeatStatusDot status={status} className="mr-0.5" />
            <dt className="text-muted-foreground">
              {SEAT_STATUS_LABELS[status]}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatNumber(counts[status])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

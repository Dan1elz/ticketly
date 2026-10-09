import { Badge } from "@/components/ui/badge"
import { EVENT_STATUS_LABELS } from "@/constants"
import type { TEventStatus } from "@/interfaces"

export function EventStatusBadge({ status }: { status: TEventStatus }) {
  const published = status === "PUBLISHED"

  return (
    <Badge variant={published ? "default" : "outline"} className="gap-1.5">
      {!published && (
        <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      )}
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  )
}

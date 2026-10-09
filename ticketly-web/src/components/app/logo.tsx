import { TicketIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <TicketIcon className="size-4 -rotate-12" />
      </span>
      {showText && <span className="text-base tracking-tight">Ticketly</span>}
    </span>
  )
}

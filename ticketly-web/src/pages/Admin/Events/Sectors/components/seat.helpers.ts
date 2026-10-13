import type { ISeat, TSeatStatus } from "@/interfaces"

// Aparência do quadradinho no mapa
export const SEAT_CELL_CLASSES: Record<TSeatStatus, string> = {
  AVAILABLE: "bg-emerald-500 text-white hover:bg-emerald-600",
  RESERVED: "bg-amber-400 text-black",
  SOLD: "bg-zinc-700 text-zinc-50 dark:bg-zinc-300 dark:text-zinc-900",
  BLOCKED:
    "bg-[repeating-linear-gradient(135deg,var(--muted)_0_5px,var(--border)_5px_7px)] text-muted-foreground ring-1 ring-border ring-inset hover:ring-foreground/40",
  CANCELLED:
    "border border-dashed border-destructive/60 text-destructive/70 line-through",
}

// Cor da legenda e da barra de contagem
export const SEAT_DOT_CLASSES: Record<TSeatStatus, string> = {
  AVAILABLE: "bg-emerald-500",
  RESERVED: "bg-amber-400",
  SOLD: "bg-zinc-700 dark:bg-zinc-300",
  BLOCKED: "bg-muted-foreground/40",
  CANCELLED: "bg-destructive/50",
}

export function isSeatActionable(seat: ISeat): boolean {
  return seat.status === "AVAILABLE" || seat.status === "BLOCKED"
}

export function seatLabel(seat: ISeat): string {
  return seat.row ? `${seat.row}${seat.number}` : `Nº ${seat.number}`
}

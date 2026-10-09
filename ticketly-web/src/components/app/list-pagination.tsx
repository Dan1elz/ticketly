import type { MouseEvent } from "react"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils"

// [1, "…", 4, 5, 6, "…", 10]
function getPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)

  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]
  )
}

export function ListPagination({
  page,
  perPage,
  total,
  onPageChange,
  itemLabel = "registros",
}: {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const go = (target: number) => (event: MouseEvent) => {
    event.preventDefault()
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target)
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? `Nenhum ${itemLabel.replace(/s$/, "")}`
          : `Mostrando ${from}–${to} de ${formatNumber(total)} ${itemLabel}`}
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                onClick={go(page - 1)}
                aria-disabled={page === 1}
                className={cn(page === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {getPages(page, totalPages).map((p, i) => (
              <PaginationItem key={`${p}-${i}`} className="hidden sm:block">
                {p === "…" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={go(p)}
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Próxima"
                onClick={go(page + 1)}
                aria-disabled={page === totalPages}
                className={cn(
                  page === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

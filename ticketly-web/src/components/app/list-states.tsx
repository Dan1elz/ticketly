import type { ReactNode } from "react"
import { CloudOffIcon, RotateCwIcon, SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

export function TableRowsSkeleton({
  rows = 5,
  columns,
}: {
  rows?: number
  columns: number
}) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow key={row} className="hover:bg-transparent">
      {Array.from({ length: columns }, (_, col) => (
        <TableCell key={col}>
          {col === 0 ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ) : (
            <Skeleton className="h-4 w-full max-w-24" />
          )}
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function ListEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

export function ListNoResults({ onClear }: { onClear: () => void }) {
  return (
    <ListEmpty
      icon={<SearchXIcon />}
      title="Nada encontrado"
      description="Nenhum resultado para os filtros aplicados."
      action={
        <Button variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
      }
    />
  )
}

export function ListError({ onRetry }: { onRetry: () => void }) {
  return (
    <ListEmpty
      icon={<CloudOffIcon />}
      title="Não foi possível carregar"
      description="Verifique se a API está rodando e tente de novo."
      action={
        <Button variant="outline" onClick={onRetry}>
          <RotateCwIcon data-icon="inline-start" />
          Tentar de novo
        </Button>
      }
    />
  )
}

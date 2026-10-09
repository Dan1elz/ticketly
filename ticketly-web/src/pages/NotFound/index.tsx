import { ArrowLeftIcon, MapPinOffIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function NotFound() {
  const { pathname } = useLocation()
  const home = pathname.startsWith("/admin") ? "/admin" : "/"

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty className="min-h-[60svh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinOffIcon />
          </EmptyMedia>
          <EmptyTitle>Página não encontrada</EmptyTitle>
          <EmptyDescription>
            O endereço não existe ou foi removido.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to={home} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Voltar ao início
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

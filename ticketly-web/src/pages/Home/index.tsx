import {
  ArmchairIcon,
  ConstructionIcon,
  MailCheckIcon,
  QrCodeIcon,
  ShieldUserIcon,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ArmchairIcon,
    title: "Escolha o assento",
    description: "Mapa do setor com o lugar reservado por 10 minutos.",
  },
  {
    icon: QrCodeIcon,
    title: "Ingresso com QR code",
    description: "Gerado na hora em que o pagamento é aprovado.",
  },
  {
    icon: MailCheckIcon,
    title: "Tudo no seu e-mail",
    description: "Ingresso e nota fiscal chegam juntos, em PDF.",
  },
]

export function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-112 max-w-3xl rounded-full bg-primary/15 blur-3xl"
      />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-14 px-4 py-16 sm:px-6 sm:py-24">
        <Empty className="max-w-xl p-0">
          <EmptyHeader className="max-w-xl gap-4">
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Em desenvolvimento
            </Badge>
            <EmptyMedia variant="icon" className="size-14 rounded-2xl">
              <ConstructionIcon className="size-7!" />
            </EmptyMedia>
            <EmptyTitle className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A vitrine de shows está sendo montada
            </EmptyTitle>
            <EmptyDescription className="text-base text-balance">
              Em breve você vai encontrar aqui os próximos shows, escolher seu
              lugar e receber o ingresso direto no e-mail.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/admin" />}
            >
              <ShieldUserIcon data-icon="inline-start" />
              Acessar o painel do admin
            </Button>
          </EmptyContent>
        </Empty>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-card/60 backdrop-blur">
              <CardContent className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          aria-hidden
          className="grid w-full gap-4 opacity-60 sm:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-video rounded-3xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

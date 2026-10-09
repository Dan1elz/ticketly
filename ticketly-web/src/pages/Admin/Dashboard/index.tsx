import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  FilePenLineIcon,
  MicVocalIcon,
  PlusIcon,
  ReceiptTextIcon,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { ArtistAvatar } from "@/components/app/artist-avatar"
import { EventStatusBadge } from "@/components/app/event-status-badge"
import { PageHeader } from "@/components/app/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"

import { useAuth } from "@/hooks/use-auth"
import { useDashboard } from "@/hooks/use-dashboard"
import { formatDateTime, formatNumber, handleError } from "@/utils"

function greeting() {
  const hour = new Date().getHours()

  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function Dashboard() {
  const { user } = useAuth()
  const { summary: data, loading, fetchSummary } = useDashboard()

  useEffect(() => {
    fetchSummary().catch((err) =>
      handleError(err, "Não foi possível carregar o resumo")
    )
  }, [fetchSummary])

  const firstName = user?.name.split(" ")[0] ?? "admin"

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Resumo do que está cadastrado no Ticketly."
        actions={
          <Button nativeButton={false} render={<Link to="/admin/shows/novo" />}>
            <PlusIcon data-icon="inline-start" />
            Novo show
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Shows publicados"
          value={data?.published}
          icon={CalendarCheckIcon}
          to="/admin/shows?status=PUBLISHED"
          loading={loading}
        />
        <StatCard
          title="Rascunhos"
          value={data?.drafts}
          icon={FilePenLineIcon}
          to="/admin/shows?status=DRAFT"
          loading={loading}
        />
        <StatCard
          title="Artistas ativos"
          value={data?.activeArtists}
          icon={MicVocalIcon}
          to="/admin/artistas?isActive=true"
          loading={loading}
        />
        <Card className="justify-between border-dashed bg-transparent shadow-none">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <ReceiptTextIcon className="size-4" />
              Pedidos
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Em breve</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Acompanhamento de cada etapa do pedido: pagamento, nota e ingresso.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shows</CardTitle>
          <CardDescription>Os próximos na agenda.</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link to="/admin/shows" />}
            >
              Ver todos
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading && !data ? (
            Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))
          ) : !data?.nextEvents.length ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>Nenhum show cadastrado</EmptyTitle>
                <EmptyDescription>
                  Os shows criados aparecem aqui.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            data.nextEvents.map((event) => (
              <Link
                key={event.id}
                to={`/admin/shows/${event.id}`}
                className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-muted/60"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDaysIcon className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{event.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDateTime(event.startsAt)} · {event.venue}
                  </span>
                </div>
                <div className="hidden -space-x-2 sm:flex">
                  {event.lineup.slice(0, 3).map((item) => (
                    <ArtistAvatar
                      key={item.id}
                      name={item.artist.name}
                      imageUrl={item.artist.imageUrl}
                      size="sm"
                      className="ring-2 ring-background"
                    />
                  ))}
                </div>
                <EventStatusBadge status={event.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  to,
  loading,
}: {
  title: string
  value?: number
  icon: LucideIcon
  to: string
  loading: boolean
}) {
  return (
    <Link to={to} className="group rounded-4xl">
      <Card className="h-full transition-colors group-hover:bg-muted/40">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Icon className="size-4" />
            {title}
          </CardDescription>
          <CardAction>
            <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading && value === undefined ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums">
              {formatNumber(value ?? 0)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

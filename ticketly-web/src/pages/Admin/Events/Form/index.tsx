import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  InfoIcon,
  MapPinIcon,
  MicVocalIcon,
  PlusIcon,
  SaveIcon,
} from "lucide-react"
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ArtistForm } from "@/components/app/artist-form"
import { EventStatusBadge } from "@/components/app/event-status-badge"
import { ListError } from "@/components/app/list-states"
import { PageHeader } from "@/components/app/page-header"
import { DatePicker } from "@/components/app/date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { EVENT_STATUS_LABELS } from "@/constants"
import { useEvents } from "@/hooks/use-events"
import type { IEvent } from "@/interfaces"
import {
  emptyArtistForm,
  emptyEventForm,
  emptyLineupItem,
  eventSchema,
  eventToForm,
  formToEventPayload,
  formToEventUpdatePayload,
  type ArtistFormOutput,
  type EventFormData,
  type EventFormOutput,
} from "@/schemas"
import { formatDateLong, handleError, handleSuccess } from "@/utils"
import { LineupItem } from "./components/lineup-item"

export function EventFormPage() {
  const { id } = useParams()
  const { selectedEvent, selectEvent } = useEvents()
  const [loadError, setLoadError] = useState(false)
  const isEdit = !!id

  // Veio da lista: o provider já tem o show e não faz requisição
  useEffect(() => {
    if (!id) return

    selectEvent(id)
      .then(() => setLoadError(false))
      .catch(() => setLoadError(true))
  }, [id, selectEvent])

  const event = isEdit && selectedEvent?.id === id ? selectedEvent : null

  const header = (
    <PageHeader
      title={isEdit ? (event?.name ?? "Editar show") : "Novo show"}
      description={
        isEdit
          ? "Atualize as informações e o lineup do show."
          : "Preencha os dados e monte o lineup."
      }
      actions={
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link to="/admin/shows" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Voltar
        </Button>
      }
    />
  )

  if (isEdit && loadError) {
    return (
      <>
        {header}
        <ListError
          onRetry={() =>
            id &&
            selectEvent(id)
              .then(() => setLoadError(false))
              .catch(() => setLoadError(true))
          }
        />
      </>
    )
  }

  if (isEdit && !event) {
    return (
      <>
        {header}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-56 rounded-4xl" />
            <Skeleton className="h-80 rounded-4xl" />
          </div>
          <Skeleton className="h-72 rounded-4xl" />
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      <EventForm key={event?.id ?? "new"} event={event ?? null} />
    </>
  )
}

function EventForm({ event }: { event: IEvent | null }) {
  const { createEvent, updateEvent } = useEvents()
  const navigate = useNavigate()
  const isEdit = !!event
  const [artistDialogIndex, setArtistDialogIndex] = useState<number | null>(
    null
  )

  const form = useForm<EventFormData, unknown, EventFormOutput>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? eventToForm(event) : emptyEventForm,
  })

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "lineup",
  })

  const onSubmit = async (data: EventFormOutput) => {
    try {
      if (event) {
        await updateEvent(event.id, formToEventUpdatePayload(data))
        handleSuccess("Show atualizado")
      } else {
        await createEvent(formToEventPayload(data))
        handleSuccess("Show criado")
      }

      navigate("/admin/shows")
    } catch (err) {
      handleError(err, "Não foi possível salvar o show")
    }
  }

  const saveNewArtist = (data: ArtistFormOutput) => {
    if (artistDialogIndex === null) return

    const path = `lineup.${artistDialogIndex}` as const

    setValue(`${path}.artistId`, null)
    setValue(`${path}.newArtist`, data)
    setValue(`${path}.artistImageUrl`, data.image?.url ?? "")
    setValue(`${path}.artistName`, data.name, { shouldValidate: true })
    setArtistDialogIndex(null)
  }

  const dialogArtist =
    artistDialogIndex !== null
      ? getValues(`lineup.${artistDialogIndex}.newArtist`)
      : null

  const lineupError = errors.lineup?.root?.message ?? errors.lineup?.message

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>
                Nome do show e onde ele acontece.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-5">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="event-name">Nome do show</FieldLabel>
                  <Input
                    id="event-name"
                    placeholder="Anitta - Turnê Funk Generation"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError errors={[errors.name]} />
                </Field>

                <Field data-invalid={!!errors.venue}>
                  <FieldLabel htmlFor="event-venue">Local</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <MapPinIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="event-venue"
                      placeholder="Allianz Parque"
                      aria-invalid={!!errors.venue}
                      {...register("venue")}
                    />
                  </InputGroup>
                  <FieldError errors={[errors.venue]} />
                </Field>

                <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <Field data-invalid={!!errors.date}>
                    <FieldLabel htmlFor="event-date">Data</FieldLabel>
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <DatePicker
                          id="event-date"
                          value={field.value}
                          onChange={field.onChange}
                          invalid={!!errors.date}
                        />
                      )}
                    />
                    <FieldError errors={[errors.date]} />
                  </Field>

                  <Field data-invalid={!!errors.time}>
                    <FieldLabel htmlFor="event-time">Abertura</FieldLabel>
                    <Input
                      id="event-time"
                      type="time"
                      aria-invalid={!!errors.time}
                      {...register("time")}
                    />
                    <FieldError errors={[errors.time]} />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lineup</CardTitle>
              <CardDescription>
                A ordem da lista é a ordem de apresentação. Horários antes da
                abertura contam como madrugada do dia seguinte.
              </CardDescription>
              {fields.length > 0 && (
                <CardAction>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append(emptyLineupItem)}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Artista
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {fields.length === 0 ? (
                <Empty className="border border-dashed py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MicVocalIcon />
                    </EmptyMedia>
                    <EmptyTitle>Lineup vazio</EmptyTitle>
                    <EmptyDescription>
                      Adicione quem vai se apresentar. Dá pra escolher um
                      artista cadastrado ou cadastrar um novo aqui mesmo.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button type="button" onClick={() => append(emptyLineupItem)}>
                    <PlusIcon data-icon="inline-start" />
                    Adicionar artista
                  </Button>
                </Empty>
              ) : (
                fields.map((field, index) => (
                  <LineupItem
                    key={field.id}
                    index={index}
                    total={fields.length}
                    onMove={move}
                    onRemove={remove}
                    onCreateArtist={setArtistDialogIndex}
                  />
                ))
              )}

              <FieldError>{lineupError}</FieldError>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Publicação</CardTitle>
              <CardDescription>
                Só shows publicados aparecem na loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {event ? (
                <Field>
                  <FieldLabel htmlFor="event-status">Status</FieldLabel>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        items={EVENT_STATUS_LABELS}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="event-status" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {Object.entries(EVENT_STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldDescription>
                    Rascunho fica visível só aqui no painel. Para publicar, o
                    show precisa de ao menos um ingresso disponível.
                  </FieldDescription>
                </Field>
              ) : (
                <p className="text-sm text-muted-foreground">
                  O show é criado como rascunho. Depois de cadastrar os setores
                  e ingressos, publique pela edição.
                </p>
              )}

              <Separator />
              <EventSummary control={control} />
            </CardContent>
          </Card>

          {!isEdit && (
            <Alert>
              <InfoIcon />
              <AlertDescription>
                Setores e assentos serão configurados depois que o show for
                criado.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {isEdit ? "Salvar alterações" : "Criar show"}
            </Button>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/admin/shows" />}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>

      <Dialog
        open={artistDialogIndex !== null}
        onOpenChange={(open) => !open && setArtistDialogIndex(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogArtist ? "Editar artista novo" : "Cadastrar artista"}
            </DialogTitle>
            <DialogDescription>
              O artista é salvo junto com o show, quando você clicar em salvar.
            </DialogDescription>
          </DialogHeader>
          {artistDialogIndex !== null && (
            <ArtistForm
              key={artistDialogIndex}
              variant="dialog"
              defaultValues={dialogArtist ?? emptyArtistForm}
              onSubmit={saveNewArtist}
              renderActions={() => (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setArtistDialogIndex(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {dialogArtist ? "Salvar artista" : "Adicionar ao lineup"}
                  </Button>
                </DialogFooter>
              )}
            />
          )}
        </DialogContent>
      </Dialog>
    </FormProvider>
  )
}

function EventSummary({ control }: { control: Control<EventFormData> }) {
  const [date, time, status, lineup] = useWatch({
    control,
    name: ["date", "time", "status", "lineup"],
  })

  const confirmed = lineup?.filter((item) => item.status === "CONFIRMED") ?? []

  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <EventStatusBadge status={status ?? "DRAFT"} />
        </dd>
      </div>
      <div className="flex items-start justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClockIcon className="size-4" />
          Quando
        </dt>
        <dd className="text-right first-letter:uppercase">
          {date ? `${formatDateLong(date)}, ${time || "--:--"}` : "—"}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <MicVocalIcon className="size-4" />
          Artistas
        </dt>
        <dd>
          {confirmed.length} confirmado{confirmed.length === 1 ? "" : "s"}
          {lineup &&
            lineup.length > confirmed.length &&
            ` · ${lineup.length - confirmed.length} cancelado${lineup.length - confirmed.length === 1 ? "" : "s"}`}
        </dd>
      </div>
    </dl>
  )
}
